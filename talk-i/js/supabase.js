const { createClient } = window.supabase;

// Supabase 配置
const supabaseUrl = 'https://tkcrnfgnspvtzwbbvyfv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY3JuZmduc3B2dHp3YmJ2eWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5ODgwMTgsImV4cCI6MjA0NjU2NDAxOH0.o4kZY3X0XxcpM3OHO3yw7O3of2PPtXdQ4CBFgp3CMO8';

// 配置选项
const options = {
    db: {
        schema: 'public'
    },
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    }
};

// 创建客户端实例
const supabase = createClient(supabaseUrl, supabaseKey, options);

// 测试连接并初始化数据
async function testConnection() {
    try {
        console.log('Testing Supabase connection...');
        
        // 尝试查询文章表
        const { error: queryError } = await supabase
            .from('articles')
            .select('count')
            .single();

        // 如果表不存在，我们需要创建它
        if (queryError && queryError.message.includes('does not exist')) {
            console.log('Articles table does not exist. Please create it in the Supabase dashboard with the following SQL:');
            console.log(`
                create table public.articles (
                    id uuid default uuid_generate_v4() primary key,
                    title text not null,
                    content text,
                    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
                    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
                    is_deleted boolean default false not null,
                    url text,
                    tags text[]
                );

                -- 启用行级安全性
                alter table public.articles enable row level security;

                -- 创建策略
                create policy "Enable read access for all users" on public.articles
                    for select using (true);

                create policy "Enable insert for authenticated users only" on public.articles
                    for insert with check (true);

                create policy "Enable update for authenticated users only" on public.articles
                    for update using (true);

                -- 创建索引
                create index articles_created_at_idx on public.articles(created_at desc);
                create index articles_title_idx on public.articles(title);
            `);
            return false;
        }

        // 如果表存在但没有数据，创建示例数据
        const { data, error: countError } = await supabase
            .from('articles')
            .select('count')
            .single();

        if (!countError && (!data || data.count === 0)) {
            console.log('No articles found, creating sample data...');
            const { error: insertError } = await supabase
                .from('articles')
                .insert([
                    {
                        title: '示例文章 1',
                        content: '这是示例文章 1 的内容',
                        url: 'https://example.com/article1',
                        tags: ['示例', '文章'],
                        is_deleted: false
                    },
                    {
                        title: '示例文章 2',
                        content: '这是示例文章 2 的内容',
                        url: 'https://example.com/article2',
                        tags: ['示例', '文章'],
                        is_deleted: false
                    }
                ]);

            if (insertError) {
                console.error('Failed to create sample data:', insertError);
                return false;
            }
            console.log('Sample data created successfully');
        }

        console.log('Supabase connection test successful');
        return true;
    } catch (err) {
        console.error('Connection test error:', err);
        return false;
    }
}

export { supabase, testConnection };