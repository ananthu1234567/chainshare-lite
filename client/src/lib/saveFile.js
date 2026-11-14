export function saveFile(name, type, data) {
    const url = URL.createObjectURL(new Blob([data], { type: type || "application/octet-stream" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }