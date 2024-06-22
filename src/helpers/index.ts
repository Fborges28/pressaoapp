type CustomObject = {
  [key: string]: any;
};

export function logJSON(json: CustomObject) {
  return console.log(JSON.stringify(json, null, 2));
}

export function isFilledObject<T>(obj: T) {
  return obj !== null && obj !== undefined && Object.keys(obj).length > 0;
}
