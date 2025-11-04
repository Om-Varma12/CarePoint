import Cookies from 'js-cookie';

interface UserData {
  userId: number;
  userName: string;
  email: string;
}

// Cookie configuration
const COOKIE_NAME = 'medwise_auth';
const COOKIE_EXPIRY_DAYS = 30; // Cookie expires in 30 days

/**
 * Save user authentication data to cookies
 */
export function saveUserToCookie(userData: UserData): void {
  try {
    const encryptedData = btoa(JSON.stringify(userData)); // Simple base64 encoding
    Cookies.set(COOKIE_NAME, encryptedData, { 
      expires: COOKIE_EXPIRY_DAYS,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production' // Only use secure in production
    });
    console.log('✅ User data saved to cookie');
  } catch (error) {
    console.error('Error saving user to cookie:', error);
  }
}

/**
 * Retrieve user authentication data from cookies
 */
export function getUserFromCookie(): UserData | null {
  try {
    const encryptedData = Cookies.get(COOKIE_NAME);
    if (!encryptedData) {
      return null;
    }
    
    const userData = JSON.parse(atob(encryptedData));
    console.log('✅ User data retrieved from cookie');
    return userData;
  } catch (error) {
    console.error('Error retrieving user from cookie:', error);
    return null;
  }
}

/**
 * Remove user authentication data from cookies (logout)
 */
export function removeUserFromCookie(): void {
  try {
    Cookies.remove(COOKIE_NAME);
    console.log('✅ User data removed from cookie');
  } catch (error) {
    console.error('Error removing user from cookie:', error);
  }
}

/**
 * Check if user is authenticated
 */
export function isUserAuthenticated(): boolean {
  return getUserFromCookie() !== null;
}