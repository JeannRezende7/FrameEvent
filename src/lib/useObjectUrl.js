import { useEffect, useState } from "react";

// Cria um object URL para pré-visualizar um arquivo local escolhido pelo
// usuário e libera a URL anterior automaticamente (evita vazamento de
// memória de recriar uma URL a cada re-render).
export function useObjectUrl(file) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}
