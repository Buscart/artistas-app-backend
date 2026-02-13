import { db } from '../db.js';
import { blogPosts } from '../schema.js';
import { desc } from 'drizzle-orm';
async function checkBlogPosts() {
    console.log('\n🔍 === VERIFICANDO POSTS DE BLOG EN LA BD ===\n');
    const posts = await db
        .select({
        id: blogPosts.id,
        title: blogPosts.title,
        featuredImage: blogPosts.featuredImage,
        gallery: blogPosts.gallery,
        createdAt: blogPosts.createdAt
    })
        .from(blogPosts)
        .orderBy(desc(blogPosts.createdAt))
        .limit(10);
    console.log(`📊 Total de posts encontrados: ${posts.length}\n`);
    if (posts.length === 0) {
        console.log('⚠️  No hay posts de blog en la base de datos\n');
        return;
    }
    posts.forEach((post, index) => {
        console.log(`${index + 1}. Post ID: ${post.id}`);
        console.log(`   Título: ${post.title}`);
        console.log(`   Featured Image: ${post.featuredImage || '❌ NULL'}`);
        console.log(`   Gallery: ${post.gallery ? JSON.stringify(post.gallery).substring(0, 100) : '❌ NULL'}`);
        console.log(`   Creado: ${post.createdAt}`);
        console.log('');
    });
    // Contar posts con y sin imagen
    const withImage = posts.filter(p => p.featuredImage).length;
    const withoutImage = posts.filter(p => !p.featuredImage).length;
    console.log(`📈 Estadísticas:`);
    console.log(`   - Con imagen destacada: ${withImage}`);
    console.log(`   - Sin imagen destacada: ${withoutImage}`);
    console.log('');
}
checkBlogPosts()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
});
