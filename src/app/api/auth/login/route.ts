import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, remember } = body as {
      email: string;
      password: string;
      remember?: boolean;
    };

    // Check for hardcoded credentials first
    if (email === "mash.mushroom.automation@gmail.com" && password === "PP@Namias99") {
      // Create a mock successful response for admin user
      const mockUser = {
        id: "admin-001",
        email: "mash.mushroom.automation@gmail.com",
        firstName: "Admin",
        lastName: "User"
      };

      const mockAccessToken = "mock-access-token-" + Date.now();
      const mockRefreshToken = "mock-refresh-token-" + Date.now();

      const accessMax = remember ? 60 * 60 * 24 * 7 : 60 * 60 * 24;
      const refreshMax = accessMax * 30;

      const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

      const response = NextResponse.json(
        { 
          success: true, 
          data: { 
            success: true,
            message: "Login successful",
            accessToken: mockAccessToken,
            refreshToken: mockRefreshToken,
            user: mockUser 
          } 
        },
        { status: 200 }
      );

      response.cookies.set('authToken', mockAccessToken, {
        path: '/',
        maxAge: accessMax,
        httpOnly: true,
        sameSite: 'strict',
        secure: isProd
      });

      response.cookies.set('refreshToken', mockRefreshToken, {
        path: '/',
        maxAge: refreshMax,
        httpOnly: true,
        sameSite: 'strict',
        secure: isProd
      });

      return response;
    }

    // If not hardcoded credentials, try backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://mash-backend-api.up.railway.app";

    const upstream = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, message: data?.message || 'Login failed' },
        { status: upstream.status }
      );
    }

    const accessToken = data?.data?.accessToken;
    const refreshToken = data?.data?.refreshToken;
    const user = data?.data?.user ?? null;

    // Determine max-age based on remember flag
    const accessMax = remember ? 60 * 60 * 24 * 7 : 60 * 60 * 24; // seconds
    const refreshMax = accessMax * 30;

    const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

    const response = NextResponse.json(
      { success: true, data: { user } },
      { status: 200 }
    );

    if (accessToken) {
      response.cookies.set('authToken', accessToken, {
        path: '/',
        maxAge: accessMax,
        httpOnly: true,
        sameSite: 'strict',
        secure: isProd
      });
    }

    if (refreshToken) {
      response.cookies.set('refreshToken', refreshToken, {
        path: '/',
        maxAge: refreshMax,
        httpOnly: true,
        sameSite: 'strict',
        secure: isProd
      });
    }

    return response;
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
