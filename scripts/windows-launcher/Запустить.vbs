' Двойной клик по этому файлу запускает программу без чёрного окна консоли
' и открывает её в браузере, когда она будет готова (обычно несколько секунд).
Dim fso, shell, scriptDir, command

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

command = """" & scriptDir & "\node\node.exe"" """ & scriptDir & "\launcher.js"""
shell.Run command, 0, False
