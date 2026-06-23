type JwtPayload = {
  role?: string;
  iss?: string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getSupabaseKeyRole(key: string): string | null {
  return decodeJwtPayload(key)?.role ?? null;
}

export function assertServiceRoleKey(key: string, envName = 'SUPABASE_SERVICE_ROLE_KEY'): void {
  if (key === 'your-service-role-key') {
    throw new Error(
      `${envName} is still the placeholder value. ` +
        'Copy the service_role key from Supabase Dashboard → Project Settings → API ' +
        '(not the anon/public key).',
    );
  }

  const role = getSupabaseKeyRole(key);
  if (role === 'anon') {
    throw new Error(
      `${envName} is the anon (public) key, not the service_role key. ` +
        'Admin APIs like auth.admin.listUsers require the service_role key from ' +
        'Supabase Dashboard → Project Settings → API. ' +
        'Alternatively export auth.users to data/auth_users-export.csv and set AUTH_USERS_SOURCE=csv.',
    );
  }

  if (role && role !== 'service_role') {
    throw new Error(`${envName} has unexpected JWT role "${role}". Expected service_role.`);
  }
}
