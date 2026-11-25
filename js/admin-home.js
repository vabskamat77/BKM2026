
const $ = id => document.getElementById(id);

let auth, api, signIn, signOut, observe,
    schools = [], selected = null,
    epoch = 0, busy = false;

const status = m => {
    $('status').textContent = m;
};

async function request(path, body) {
    const user = auth.currentUser;

    if (!user) {
        throw Error('Sign in required');
    }

    const token = await user.getIdToken();

    const response = await fetch(api + path, {
        method: body ? 'POST' : 'GET',
        headers: {
            Authorization: 'Bearer ' + token,
            ...(body ? {
                'Content-Type': 'application/json'
            } : {})
        },
        ...(body ? {
            body: JSON.stringify(body)
        } : {})
    });

    let data;

    try {
        data = await response.json();
    } catch {
        throw Error(
            'Unexpected API response (' + response.status + ')'
        );
    }

    if (!response.ok || !data.ok) {
        throw Error(data.error || 'Request failed');
    }

    return data;
}

async function load() {
    const e = epoch;

    const d = await request('/api/admin-dashboard');

    if (e !== epoch) return;

    const stats = $('stats');

    stats.replaceChildren();

    for (const [key, label] of Object.entries({
        registered: 'Registered schools',
        active: 'Active schools',
        competitions: 'Competitions',
        published: 'Published results',
        points: 'Points awarded'
    })) {
        const div = document.createElement('div');
        const strong = document.createElement('strong');

        div.className = 'admin-stat';

        strong.textContent = Number.isFinite(d.stats?.[key])
            ? String(d.stats[key])
            : '—';

        div.append(
            strong,
            document.createTextNode(label)
        );

        stats.append(div);
    }

    $('dashboard').hidden = false;

    status('Administrator verified · Live database connected');
}

$('loginForm').onsubmit = async e => {
    e.preventDefault();

    const button = e.target.querySelector('button');

    button.disabled = true;

    try {
        await signIn(
            auth,
            $('email').value.trim(),
            $('password').value
        );
    } catch (e) {
        status('Sign-in failed: ' + e.message);
    } finally {
        $('password').value = '';
        button.disabled = false;
    }
};

$('logout').onclick = () =>
    signOut(auth).catch(e => status(e.message));

try {
    const cfg = await import('./firebase-config.js');

    auth = cfg.auth;
    api = cfg.API_BASE_URL;

    if (!api) {
        throw Error('API_BASE_URL is missing');
    }

    const mod = await import(
        'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'
    );

    signIn = mod.signInWithEmailAndPassword;
    signOut = mod.signOut;
    observe = mod.onAuthStateChanged;

    observe(auth, async user => {
        epoch++;

        const e = epoch;

        $('dashboard').hidden = true;
        $('login').hidden = !!user;
        $('logout').hidden = !user;

        if (!user) {
            status(
                'Sign in with your authorized administrator account'
            );
            return;
        }

        status('Verifying administrator…');

        try {
            await load();
        } catch (err) {
            if (e === epoch) {
                status(err.message);
            }
        }
    });

} catch (e) {
    status('Initialization failed: ' + e.message);
}
