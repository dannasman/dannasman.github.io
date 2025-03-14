import os

if __name__ == "__main__":
    files = sorted(os.listdir("posts"), reverse=True)
    
    print("<ul>")
    for file in files:
        print(f"""\t<li><a href="posts/{file}">Placeholder</a></li>""")
    print("</ul>")

