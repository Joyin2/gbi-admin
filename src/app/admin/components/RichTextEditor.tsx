import { EditorProvider } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import * as React from 'react';

interface RichTextEditorProps {
  content: string;
  onUpdate: (content: string) => void;
}

const extensions = [StarterKit];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onUpdate }) => {
  return (
    <EditorProvider
      extensions={extensions}
      content={content}
      onUpdate={({ editor }) => {
        onUpdate(editor.getHTML());
      }}
      editorProps={{
        attributes: {
          class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[200px] p-4 text-gray-900',
        },
      }}
      editorContainerProps={{ 
        className: 'min-h-[200px] border border-gray-300 rounded-md bg-white' 
      }}
    />
  );
};

export default RichTextEditor;