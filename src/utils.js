const units = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

export function prettyPrintBytes(value) {
  let index = 0;
  let val = value;

  while (val >= 1024 && ++index) {
    val /= 1024;
  }

  return `${+parseFloat(val).toFixed(2)} ${units[index]}`;
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = filename;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
