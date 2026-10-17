// Chỉ dùng cho test: Vite cho phép import './client' không đuôi, còn Node thì không -> tự thêm .js
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      return nextResolve(`${specifier}.js`, context);
    }
    throw err;
  }
}
