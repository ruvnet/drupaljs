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
        plugins: 'advlist autolink lists link image charmap print preview anchor',
        toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
        height: 300,
        setup: (editor) => {
          editor.on('change', () => {
            onChange(editor.getContent());
          });
        },
      });
    };

    return () => {
      if (window.tinymce) {
        window.tinymce.remove(editorRef.current);
      }
      document.body.removeChild(script);
    };
  }, []);

  return <textarea ref={editorRef} defaultValue={content} />;
};

export default TinyMCEEditor;