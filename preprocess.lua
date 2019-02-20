-- For fun!
-- A Lua script that turns markdown-like-files into HTML for this site.
-- Curtis Fenner

function escape(str)
	return (str:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"))
end

function format(str)
	-- TODO: support * and ** for emphasis and strong respectively
	local result = str:gsub("%b``", function(n)
		return "<code>" .. n:sub(2, -2) .. "</code>"
	end):gsub("<code></code>", "``"):gsub("``.-``", function(n)
		return "<code>" .. n:sub(3, -3):gsub("</?code>", "`") .. "</code>"
	end)
	result = result:gsub("%-%-", "&mdash;")
	return result
end

local HEADER = io.open("header.html"):read "*all"
local FOOTER = io.open("footer.html"):read "*all"

--------------------------------------------------------------------------------

local function isAlone(line)
	if line:sub(1, 1) == "`" and line:sub(-1, -1) == "`" and not line:sub(2, -2):find("`") and #line > 4 then
		-- Line indicates an external code import
		local fileName = directory .. ".code/" .. line:sub(2, -2)
		local file = io.open(fileName, "r")
		if not file then
			print("could not open file `" .. fileName .. "`")
			os.exit(1)
		end

		-- Sanitize HTML by replacing special characters with their entities
		local contents = file:read("*all")
		contents = contents:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&lt;")
		return "<pre>\n" .. contents .. "</pre>"
	elseif line:sub(1, 4) == "----" then
		-- Line indicates a horizontal rule
		return "<hr>"
	elseif line:sub(1, 1) == "#" then
		-- Line indicates a heading
		local sigil, rest = line:match("^(#+)(.+)")
		if not rest then
			print("invalid heading")
			return false
		end
		if sigil == "#" then
			return "</section><section><h1>" .. escape(rest) .. "</h1>"
		end
		return "<h" .. #sigil .. ">" .. escape(rest) .. "</h" .. #sigil .. ">"
	end
end

local function isCode(line)
	return line:sub(1, 3) == "```"
end

local function isBullet(line)
	if line:find("%S") then
		if line:find("%+") == line:find("%S") then
			return line:sub(line:find("%S") + 1, -1), line:sub(line:find("%S")):sub(1, 1)
		end
	end
end

--------------------------------------------------------------------------------

function compileSection(section)
	local blocks = {{type = "p"}}
	-- Group paragraphs
	for i = 1, #section do
		local line = section[i]
		local top = blocks[#blocks]
		if top.type ~= "code" and not line:find("%S") then
			table.insert(blocks, {type = "p"})
		elseif top.type == "code" and isCode(line) then
			table.insert(blocks, {type = "p"})
		elseif isAlone(line) then
			table.insert(blocks, {type = "line", tag = isAlone(line)})
			table.insert(blocks, {type = "p"})
		elseif isCode(line) then
			table.insert(blocks, {type = "code", class = line:sub(4)})
		elseif isBullet(line) then
			table.insert(blocks, {type = "bullet", level = line:find("%S"), (isBullet(line))})
		else
			assert(top.type == "code" or top.type == "p" or top.type == "bullet")
			table.insert(top, line)
		end
	end
	-- Compile
	local out = ""
	local list = {}
	for i = 1, #blocks do
		if blocks[i].type ~= "bullet" then
			while #list > 0 do
				table.remove(list)
				out = out .. "\t\t</ul>\n"
			end
		end
		if blocks[i].type == "p" then
			local content = table.concat(blocks[i], "\n\t\t")
			if #content:gsub("%s+", "") > 0 then
				out = out .. "\t\t<p>\n\t\t\t" .. format(escape(content)) .. "\n\t\t</p>\n"
			end
		elseif blocks[i].type == "code" then
			out = out .. "\t\t<pre class=\"" .. blocks[i].class .. "\">\n" .. escape(table.concat(blocks[i], "\n")) .. "</pre>\n"
		elseif blocks[i].type == "line" then
			out = out .. "\t\t" .. blocks[i].tag .. "\n"
		elseif blocks[i].type == "bullet" then
			if #list == 0 or list[#list] < blocks[i].level then
				out = out .. "\t\t<ul>\n"
				table.insert(list, blocks[i].level)
			end
			while #list > 0 and list[#list] > blocks[i].level do
				table.remove(list)
				out = out .. "</ul>\n"
			end
			out = out .. "\t\t\t<li>" .. format(escape(table.concat(blocks[i], "\n"))) .. "\n"
		else
			error("unknown type " .. blocks[i].type)
		end
	end
	return out
end

function compileMD(contents)
	-- Split into lines. These will be recombined later.
	local lines = {}
	for line in string.gmatch(contents .. "\n", "([^\n]*)\n") do
		table.insert(lines, line)
	end
	-- Take first line as the title.
	local title = table.remove(lines, 1)
	-- Split into sections
	local sections = {{}}
	for i = 1, #lines do
		if lines[i]:gsub("%s*", "") == "#" then
			table.insert(sections, {})
		else
			table.insert(sections[#sections], lines[i])
		end
	end
	-- Compile the sections
	for i = 1, #sections do
		sections[i] = compileSection(sections[i])
	end
	-- Combine results
	local output = HEADER:gsub("%{%{TITLE%}%}", title)
		.. table.concat(sections, "\n\t</section>\n\n\t<section>\n")
		.. FOOTER
	output = output:gsub("<section>%s*</section>%s*<section>", "<section>")
	return output
end

--------------------------------------------------------------------------------

function process(path)
	local dir, file = path:match("^(.*)/([^/]+)$")
	local input = dir .. ".note/" .. file .. ".md"
	local output = dir .. "/" .. file .. ".html"
	local f = io.open(input)
	if not f then
		print("not such file '" .. input .. "'")
		return
	end
	print(input, "-->", output)
	local out = io.open(output, "wb")
	if not out then
		print("cannot write file '" .. output .. "'")
		os.exit(1)
	end
	out:write(compileMD(f:read("*all")))
	out:close()
end

local dir = arg[1]
if not dir then
	print("usage:\n\tlua preprocess.lua <outdirectory>")
	os.exit(1)
end

for line in io.popen("ls " .. dir .. ".note"):lines() do
	local pattern = line:match("^(.-)%.md$")
	if pattern then
		process(dir .. "/" .. pattern)
	end
end
