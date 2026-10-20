import os, json
B=os.path.dirname(os.path.abspath(__file__)); src=lambda f: open(os.path.join(B,'src',f),encoding='utf-8').read()
out=os.path.join(B,'dist','apps-script'); os.makedirs(out,exist_ok=True)
probl=src('problemen.js').replace("if (typeof module !== 'undefined') module.exports = HEUR;\n",'')
assert 'module.exports' not in probl
open(os.path.join(out,'Problemen.gs'),'w',encoding='utf-8').write(probl)
open(os.path.join(out,'Code.gs'),'w',encoding='utf-8').write(src('server.js'))
open(os.path.join(out,'Index.html'),'w',encoding='utf-8').write(src('Index.html'))
json.dump({"timeZone":"Europe/Brussels","dependencies":{"enabledAdvancedServices":[{"userSymbol":"People","serviceId":"peopleapi","version":"v1"}]},"exceptionLogging":"STACKDRIVER","runtimeVersion":"V8",
  "webapp":{"executeAs":"USER_DEPLOYING","access":"DOMAIN"},
  "oauthScopes":["https://www.googleapis.com/auth/spreadsheets.currentonly","https://www.googleapis.com/auth/userinfo.email","https://www.googleapis.com/auth/directory.readonly"]},
  open(os.path.join(out,'appsscript.json'),'w'),indent=2)
html=src('Index.html')
inj='\n'.join('<script>\n'+x+'\n</script>' for x in [probl, src('gas-fake.js').replace("if (typeof module !== 'undefined') module.exports = GASFAKE;\n",''), src('server.js'), src('demo-seed.js')])
i=html.index('<script>\n/* ================= hulpfuncties')
html=html[:i]+inj+'\n'+html[i:]
html=html.replace('start();\n</script>\n</body>','DEMO.seedData(); window.MOCK_API = DEMO.api(); DEMO.banner();\ncsv = function () { toast(\'In de echte website krijg je hier een CSV-bestand.\'); };\nstart();\n</script>\n</body>')
assert 'DEMO.seedData()' in html
html=html.replace('<title>Heuristieken wiskunde 1ste jaar</title>','<title>Demo heuristieken 1ste jaar</title>').replace('<base target="_top">\n','')
for t in ['<!DOCTYPE html>\n','<html lang="nl">\n','<head>\n','<meta charset="utf-8">\n','<meta name="viewport" content="width=device-width, initial-scale=1">\n','</head>\n','<body>\n','</body>\n','</html>\n']:
    assert t in html, t; html=html.replace(t,'',1)
open(os.path.join(B,'dist','demo.html'),'w',encoding='utf-8').write(html)
print('ok', len(html)//1024,'kB')
