/**
 * Converts a single string from snake_case to camelCase.
 * @param {string} str The string to convert
 * @returns {string} The camelCased string
 */
const toCamel = (str) => {
  return str.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace("-", "").replace("_", "");
  });
};

/**
 * Converts all keys of an object from snake_case to camelCase
 * @param {object} obj The object to convert
 * @returns {object} A new object with camelCased keys
 */
export const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((v) => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [toCamel(key)]: toCamelCase(obj[key]),
      }),
      {}
    );
  }
  return obj;
};
