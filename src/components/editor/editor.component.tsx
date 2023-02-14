import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { AsmSyntaxError } from "../../armvm/errors";
import "./editor.css";

export const EditorComponent = (props: { text: string, errors: AsmSyntaxError[], currentLine?: number }) => {
    const { text, errors, currentLine } = props
    const [editor, setEditor] = useState<any>();
    const [monaco, setMonaco] = useState<any>();

    useEffect(() => {
        if (!editor || !monaco || !currentLine) return
        const ids = editor.deltaDecorations(
            [],
            [
                {
                    range: new monaco.Range(currentLine, 1, currentLine, 1),
                    options: { className: "line-current", isWholeLine: true }
                }
            ]
        );
        console.log("Coloring line", ids)
        return () => editor.deltaDecorations(ids, []);
    }, [editor, monaco, currentLine])

    useEffect(() => {
        if (!editor) return
        // const uri = monaco.Uri.parse("inmemory://test");
        // const model = monaco.editor.createModel(text, "assembly", uri)
        editor.getModel().setValue(text)
    }, [text, editor, monaco])

    useEffect(() => {
        
        if (!editor || !monaco) return

        const model = editor.getModel()
        const markers = [];

        for (const err of errors) {
            if (!(err instanceof AsmSyntaxError)) continue
            const addr = err.token.addr
            markers.push({
                message: err.message,
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: addr.row,
                startColumn: addr.col,
                endLineNumber: addr.row,
                endColumn: addr.col + err.token.value.length,
            })
        }
        monaco.editor.setModelMarkers(model, "owner", markers);
        console.log("model", editor.getModel())
    }, [editor, monaco, errors])

    return <div className="asm-editor">
        <Editor
            height="90vh"
            defaultLanguage="asm"
            defaultValue={text}
            onMount={(editor, monaco) => {
                setEditor(editor)
                setMonaco(monaco)
            }}
        />
    </div>
}