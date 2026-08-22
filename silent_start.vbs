' ==============================================================================
' AI Token Monitor - Silent Background Launcher (No CMD / No Taskbar Window)
' ==============================================================================
Option Explicit

Dim WshShell, fso, scriptDir, serverScript
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get dynamic directory where this script is located (Resilient to folder moving)
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
serverScript = scriptDir & "\token-dashboard\server.cjs"

If fso.FileExists(serverScript) Then
    ' Run node server.cjs with window hidden (0 = Hide, False = Non-blocking)
    WshShell.Run "node """ & serverScript & """", 0, False
Else
    MsgBox "Cannot find server.cjs at: " & serverScript, 16, "AI Token Monitor Error"
End If
