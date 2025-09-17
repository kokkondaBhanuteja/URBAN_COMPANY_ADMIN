import { NextRequest, NextResponse } from 'next/server';
import passport from '@/lib/passport';
import { loginUser } from '@/services/authService';
import { IUser } from '@/database/userModel'; // 1. Import the IUser type

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Another workaround to get passport to play nice
  const user = await new Promise<IUser | false>((resolve, reject) => { // 2. Use the IUser type here
    const auth = passport.authenticate('google', (err: Error, user: IUser | false) => { // 3. Type 'err' and 'user'
      if (err) return reject(err);
      resolve(user);
    });
    auth(req);
  });

  if (!user) {
    // Redirect to login with a generic error if user is not authenticated
    return NextResponse.redirect('/login?error=Authentication failed');
  }

  try {
    // Re-use your login service to generate a token
    const { token } = await loginUser(user.email); 
    const url = new URL('/', req.url);
    url.searchParams.set('token', token);
    return NextResponse.redirect(url);
  } catch (error) { // 4. Handle the error more safely
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }
}
