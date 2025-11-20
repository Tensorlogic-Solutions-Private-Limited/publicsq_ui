import { json as json$1 } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function POST({ params, request, cookies, fetch: eventFetch }) {
  try {
    const body = await request.json();

    const endpoint = PUBLIC_API_BASE_URL + "/v1/login";

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };

    // Use eventFetch instead of fetch
    const res = await eventFetch(endpoint, options);
    if (res.status == 200) {
      const user = await res.json();
      cookies.set("access_token", user.access_token, {
        httpOnly: true,
        sameSite: "strict",
        // secure: process.env.NODE_ENV === "production",
        secure:false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      cookies.set("token_type", user.token_type, {
        httpOnly: true,
        sameSite: "strict",
        // secure: process.env.NODE_ENV === "production",
        secure:false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      cookies.set("username", user.username, {
        httpOnly: true,
        sameSite: "strict",
        // secure: process.env.NODE_ENV === "production",
        secure:false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      cookies.set("user_id", String(user.user_uuid), {
        httpOnly: true,
        sameSite: "strict",
        // secure: process.env.NODE_ENV === "production",
        secure:false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      cookies.set("role_name", user.role_name, {
        httpOnly: true,
        sameSite: "strict",
        // secure: process.env.NODE_ENV === "production",
        secure:false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      cookies.set("role_code", user.role_code, {
        httpOnly: true,
        sameSite: "strict",
        // secure: process.env.NODE_ENV === "production",
        secure:false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return json$1(
        {
          user,
        },
        {
          status: 201,
        }
      );
    }

    return new Response(res.body, { status: res.status });
  } catch (err) {
    
    // Always return a Response in case of errors
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred" }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}