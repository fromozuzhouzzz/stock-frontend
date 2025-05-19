/**
 * JWT工具函数
 */

/**
 * 解析JWT token
 * @param token JWT token字符串
 * @returns 解析后的payload，或null（如果token无效）
 */
export function parseJwt(token: string): any | null {
  try {
    // 将Base64URL格式转换为Base64
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // 解码
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('解析JWT token失败:', e);
    return null;
  }
}

/**
 * 检查token是否过期或即将过期
 * @param token JWT token字符串
 * @param expirationBuffer 过期前的缓冲时间（秒），默认300秒（5分钟）
 * @returns 
 * - true: token已过期或即将过期
 * - false: token有效且不会在短期内过期
 */
export function isTokenExpiredOrExpiring(token: string, expirationBuffer: number = 300): boolean {
  try {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) {
      return true; // 没有exp字段，视为过期
    }

    const currentTime = Math.floor(Date.now() / 1000); // 当前时间（秒）
    const expirationTime = payload.exp;

    // 如果当前时间+缓冲时间 >= 过期时间，则认为token即将过期
    return (currentTime + expirationBuffer) >= expirationTime;
  } catch (e) {
    console.error('检查token过期失败:', e);
    return true; // 出错时，保守处理，视为已过期
  }
}

/**
 * 获取token中的用户ID
 * @param token JWT token字符串
 * @returns 用户ID或null
 */
export function getUserIdFromToken(token: string): string | null {
  try {
    const payload = parseJwt(token);
    return payload?.sub || null;
  } catch (e) {
    return null;
  }
} 