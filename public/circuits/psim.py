from collections import defaultdict
from numpy import linalg, array
from typing import List, Dict, Tuple
import math

DIAGNOSE = False


def solveLinear(eqs: List[Tuple[Dict[str, float], float]]):
    vs = set()
    for row, cons in eqs:
        vs = vs | set(row.keys())

    vs = list(vs)

    m = []
    c = []
    for row, cons in eqs:
        c.append(cons)
        r = []
        for v in vs:
            r.append(row[v] if v in row else 0)
        m.append(r)

    ans, resid, rank, sing = linalg.lstsq(m, c, rcond=1e4)

    out = {}
    for i in range(len(vs)):
        out[vs[i]] = ans[i]
    return out


# Thermal voltage at 300K.
V_T = 0.0258563


class Diode:
    def __init__(self, I_S, n):
        self._I_S = I_S
        self._n = n

    def _voltsToAmps(self, volts):
        # Shockley's diode equation
        return self._I_S * (math.exp(volts / (self._n * V_T)) - 1)

    def linearApprox(self, nearVolts):
        """
        RETURNS a description of a line where the input is the voltage
        and the output is the current.
        """
        c = self._n * V_T
        slope = self._I_S / c * math.exp(nearVolts / c)
        intercept = self._voltsToAmps(nearVolts) - slope * nearVolts
        return {"slope": slope, "intercept": intercept}


class Transistor:
    def __init__(self, I_S, B_F, B_R):
        self._I_S = I_S
        self._B_F = B_F
        self._B_R = B_R

    def voltsToAmps(self, base, collector, emitter):
        def e(v): return math.exp(v / V_T)
        v_be = emitter - base
        v_bc = collector - base

        a_c = 1 / (1 + self._B_F)
        a_e = 1 / (1 + self._B_R)

        ic = -self._I_S / a_c * e(v_bc) + self._I_S * e(v_be)
        ie = -self._I_S / a_e * e(v_be) - self._I_S * e(v_bc)
        ib = ie - ic

        return {
            "collector": ic,
            "base": ib,
            "emitter": ie,
        }

    def linearApprox(self, base, collector, emitter):
        pass


class Circuit:
    def __init__(self):
        self._nodes = {}
        self._edges = set()
        self._resistors = []
        self._batteries = []
        self._diodes = []
        self._vendState = 0
        pass

    def _addNode(self, node):
        self._nodes[node] = True

    def _vend(self, hint):
        self._vendState = self._vendState + 1
        return "%s:%d" % (hint, self._vendState)

    def resistor(self, a, b, ohms):
        self._addNode(a)
        self._addNode(b)
        self._edges |= {(min(a, b), max(a, b))}
        self._resistors.append({"from": a, "to": b, "ohms": ohms})
        pass

    def battery(self, pos, neg, volts):
        self._addNode(pos)
        self._addNode(neg)
        self._edges |= {(min(pos, neg), max(pos, neg))}
        self._batteries.append({
            "pos": pos, "neg": neg, "volts": volts
        })

    def diode(self, f, to, diode):
        self._addNode(f)
        self._addNode(to)
        self._edges |= {(min(f, to), max(f, to))}
        self._diodes.append({
            "from": f,
            "to": to,
            "diode": diode,
        })

    def _currentVar(self, src, dst):
        assert (min(src, dst), max(src, dst)) in self._edges

        if src < dst:
            return ("I_{" + src + "," + dst + "}", 1)
        else:
            return ("I_{" + dst + "," + src + "}", -1)

    def _adj(self, node):
        into = {x for (x, y) in self._edges if y == node}
        outof = {y for (x, y) in self._edges if x == node}
        return into | outof

    def solveSingle(self, zero, previous):
        eqs = []

        # Kirchhoff's first law: current is divergence free.
        for node in self._nodes:
            eq = defaultdict(lambda: 0)
            for adj in self._adj(node):
                var, scale = self._currentVar(adj, node)
                eq[var] = scale
            eqs.append((eq, 0))

        # Resistors: Ohm's Law
        for r in self._resistors:
            ivar, sign = self._currentVar(r["from"], r["to"])
            eq = {
                ivar: sign,
                r["to"]: 1.0 / r["ohms"],
                r["from"]: -1.0/r["ohms"],
            }
            eqs.append((eq, 0))

        # Batteries: Voltage Sources
        for b in self._batteries:
            eq = {
                b["pos"]: 1,
                b["neg"]: -1,
            }
            eqs.append((eq, b["volts"]))

        # Diodes: Non linear sources, given a linear approximation
        for d in self._diodes:
            if previous:
                voltageEstimate = previous[d["from"]] - previous[d["to"]]
            else:
                voltageEstimate = 0.6
            line = d["diode"].linearApprox(voltageEstimate)
            # I = m * V + b = m * (V1 - V0) + b
            # -b = m * V1 - m * V0 - I
            ivar, sign = self._currentVar(d["from"], d["to"])
            eq = {
                d["from"]: line["slope"],
                d["to"]: -line["slope"],
                ivar: -sign,
            }
            eqs.append((eq, -line["intercept"]))

        # Ground
        eqs.append(({zero: 1}, 0))

        soln = solveLinear(eqs)

        # Do evaluation
        if DIAGNOSE:
            print("*" * 80)
            for r, c in eqs:
                print("\t", c, "=", dict(r))
                ev = 0
                for k in r:
                    ev += r[k] * soln[k]
                print("\t\t", c, "=", ev)

        return soln

    def solve(self, zero):
        # Do not allow variables to travel more than 0.1 per iteration.
        # This is necessary since some linear approximations can be very flat or
        # very steep (such as diode's e^x), which can result in giant movements.
        limits = defaultdict(lambda: 0.1)
        prev = False
        for _ in range(1000):
            y = self.solveSingle(zero=zero, previous=prev)
            if prev:
                scale = 1.0
                for key in y.keys():
                    delta = y[key] - prev[key]
                    scale = max(scale, abs(delta / limits[key]))
                n = {}
                for key in y.keys():
                    n[key] = prev[key] + (y[key] - prev[key]) / scale
                prev = n
            else:
                prev = y

        return prev


# 2N2903 base->emitter path.
BASE_EMITTER = Diode(I_S=196e-12, n=1.76)
T_2N3904 = Transistor(I_S=6.7e-15, B_F=416, B_R=0.737)

c = Circuit()
c.battery(neg="y", pos="+", volts=6.38)
c.resistor("+", "a", ohms=330)
c.diode("a", "y", diode=BASE_EMITTER)
c.diode("a", "x", diode=BASE_EMITTER)
c.diode("x", "y", BASE_EMITTER)

soln = c.solve(zero="y")
for k, v in sorted(soln.items()):
    pass
    #print("%s:\t%.7f" % (k, v))

# http://www.ecircuitcenter.com/SpiceTopics/Non-Linear%20Analysis/Non-Linear%20Analysis.htm
print(T_2N3904.voltsToAmps(base=0.786, collector=0.060, emitter=0))
