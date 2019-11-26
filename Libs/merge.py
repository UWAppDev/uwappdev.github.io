import sys

# Get the contents of a file,
#excluding quotation makrs and
#spaces from the path.
def getFile(name):
    nm = ""
    quoteChars = 0
    
    for i in range(0, len(name)):
        c = name[i]

        if c != '"' and c != "'" and c != ' ' and c != '>' and c != '&' and c != '|' \
                and (i > 3 or c != "/" or c != "."):
            nm += c
        elif c == '"' or c == "'":
            quoteChars += 1
            
            if quoteChars > 1:
                break
    out = ""
    
    try:
        f = open(nm)
        out = f.read()
        f.close()
    except:
        print (" [-] FILE READ ERROR!!!")
        out += "/* FILE READ ERROR */"

    return out

# Merge refrences to external scripts
#into a single HTML file. This currently supports
#only filesystem paths. No URLs.
#TODO Add support for merging styles.
def merge(fileName, outputFileName = "mergedOutput.html"):
    file = open(fileName)
    buf = file.read()
    lins = buf.split("\n") # Break into lines.

    out = ""

    print ("[*] Searching file %s..." % fileName)

    # For every line.
    for lin in lins:
        out += "\n" # Note that this is a new line.

        # Is there a script tag on this line?
        if lin.find("<script src") != -1 and lin.find("</script>") != -1: # TODO Allow this to work for lines without a </script> -- in HTML this tag can be placed on the following line.
            start = lin.find("=") + 1
            end = lin.find(">")

            src = lin[start : end]

            print ("[*] Getting script block at %d %d. Block %s." % (start, end, src))

            out += """
<!-- Inserted file """ + src + """. -->
<script>
"""
            out += getFile(src)
            out += "\n</script>\n"

            print (" [+] Done!")
        # Is it a style block?
        elif lin.find("<link ") != -1 and lin.find("stylesheet") != -1 and lin.find("rel") != -1 \
                and lin.find("href") != -1 and lin.find(">") != -1:
            startHref = lin.find("href")
            trimmedLine = lin[startHref + len("href") :]

            startSrc = trimmedLine.find("=") + 1
            endSrc = trimmedLine.find(">") - 1

            src = trimmedLine[startSrc : endSrc]

            print ("[*] Getting style block with src %s." % src)

            out += """
<!-- Inserted File. """ + src + """. -->
<style>
"""
            out += getFile(src)

            out += """
</style>
""";
            print (" [+] Done!")
        else:
            # Otherwise, add the current line to the
            #output.
            out += lin

    file.close()

    print ("[*] Writing...")

    # Write output.
    outFile = open(outputFileName, "w")
    outFile.write(out)

    outFile.close()

# If run directly
if __name__ == "__main__":
    if len(sys.argv) <= 1:
        print ("Help: \n Usage: python " + str(sys.argv[0]) + " fromFile toFile")
    else:
        fromFile = sys.argv[1]
        toFile = "merged_" + fromFile

        if (len(sys.argv) > 2):
            toFile = sys.argv[2]

        merge(fromFile, toFile)
