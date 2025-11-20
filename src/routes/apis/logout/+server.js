import { json } from '@sveltejs/kit';

export async function POST({ cookies }) {
	let res;

	try {
		res = await new Promise((resolve) => {
			setTimeout(() => {
				// ✅ Always clear ALL cookies (even if auth_token is missing)
				const allCookies = cookies.getAll();
				allCookies.forEach(({ name }) => {
					cookies.set(name, '', {
						path: '/',
						maxAge: 0
					});
				});

				resolve(new Response(null, { status: 204 }));
			}, 1000);
		});

		return json({}, { status: 200 });
	} catch (err) {
		// fallback error
		return json({ error: err.message || 'Logout failed' }, { status: 500 });
	}
}
