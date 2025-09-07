import { NextRequest } from 'next/server';
import passport from '@/lib/passport';

export async function GET(req: NextRequest) {
    const authenticate = passport.authenticate('google', { scope: ['profile', 'email'] });
    // This is a bit of a workaround to make passport work in this environment
    const res = new Response();
    const result = await new Promise((resolve, reject) => {
        const reqWithNext = Object.assign(req, {
            // passport expects a `next` function
            next: (err?: Error) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            },
        });
        authenticate(reqWithNext, res);
    });

    return result as Response;
}
