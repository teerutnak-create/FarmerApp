import 'url-polyfill';
import { createClient } from '@supabase/supabase-js';

// แก้ไขให้เหลือเฉพาะ Project Domain หลัก (ห้ามมี /rest/v1/ ต่อท้าย)
const SUPABASE_URL = 'https://rymgsrvsziaijrnafvyx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_R1mQbFjN9ZTyFQ7zfhGLVA_QYt7UEuK';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);