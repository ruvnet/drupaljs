import React, { useRef, useEffect } from 'react';

const TinyMCEEditor = ({ content, onChange }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/tinymce/tinymce.min.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.tinymce.init({
        target: editorRef.current,
        height: 500,
        menubar: false,
        plugins: [
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime media table paste code help wordcount'
        ],
        toolbar:
          'undo redo | formatselect | bold italic backcolor | \
          alignleft aligncenter alignright alignjustify | \
          bullist numlist outdent indent | removeformat | help',
        setup: (editor) => {
          editor.on('change', () => {
            onChange(editor.getContent());
          });
        },
        init_instance_callback: (editor) => {
          editor.setContent(content);
        }
      });
    };

    return () => {
      if (window.tinymce) {
        window.tinymce.remove(editorRef.current);
      }
      document.body.removeChild(script);
    };
  }, []);

  return <textarea ref={editorRef} />;
};

export default TinyMCEEditor;
