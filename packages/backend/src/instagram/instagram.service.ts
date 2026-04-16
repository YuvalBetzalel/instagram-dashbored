import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstagramService {
  constructor(private prisma: PrismaService) {}

  private get token() {
    return process.env.INSTAGRAM_ACCESS_TOKEN || '';
  }

  async getInsights() {
    if (!this.token) return this.demoInsights();

    try {
      const [userRes, mediaRes] = await Promise.all([
        fetch(
          `https://graph.instagram.com/me?fields=id,username,followers_count,media_count&access_token=${this.token}`,
        ),
        fetch(
          `https://graph.instagram.com/me/media?fields=id,like_count,comments_count,timestamp,media_type&limit=24&access_token=${this.token}`,
        ),
      ]);

      const user = await userRes.json();
      const media = await mediaRes.json();

      if (user.error) return this.demoInsights();

      const posts: any[] = media.data ?? [];
      const totalLikes = posts.reduce((s: number, p: any) => s + (p.like_count ?? 0), 0);
      const totalComments = posts.reduce((s: number, p: any) => s + (p.comments_count ?? 0), 0);
      const engRate =
        user.followers_count > 0 && posts.length > 0
          ? +((totalLikes + totalComments) / posts.length / user.followers_count * 100).toFixed(2)
          : 0;

      return {
        followers: user.followers_count ?? 0,
        mediaCount: user.media_count ?? 0,
        engagementRate: engRate,
        username: user.username ?? '',
        bestHours: this.calcBestHours(posts),
        recentPosts: posts.slice(0, 6).map((p: any) => ({
          id: p.id,
          likes: p.like_count ?? 0,
          comments: p.comments_count ?? 0,
          timestamp: p.timestamp,
          type: p.media_type,
        })),
      };
    } catch {
      return this.demoInsights();
    }
  }

  async schedulePost(caption: string, scheduledAt: string, scriptId?: string) {
    return this.prisma.post.create({
      data: { caption, scheduledAt: new Date(scheduledAt), scriptId, status: 'pending' },
    });
  }

  async getQueue() {
    return this.prisma.post.findMany({
      orderBy: { scheduledAt: 'asc' },
      include: { script: { select: { id: true, content: true, contentType: true } } },
    });
  }

  async publishPost(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');

    // In production: call IG API to publish. Here we mark as published.
    return this.prisma.post.update({
      where: { id: postId },
      data: { status: 'published', publishedAt: new Date() },
    });
  }

  async deletePost(postId: string) {
    return this.prisma.post.delete({ where: { id: postId } });
  }

  private calcBestHours(posts: any[]) {
    const counts = Array(24).fill(0);
    const engagement = Array(24).fill(0);
    posts.forEach((p) => {
      const h = new Date(p.timestamp).getHours();
      counts[h]++;
      engagement[h] += (p.like_count ?? 0) + (p.comments_count ?? 0);
    });
    return engagement.map((eng, hour) => ({
      hour,
      avgEngagement: counts[hour] > 0 ? Math.round(eng / counts[hour]) : 0,
    }));
  }

  private demoInsights() {
    const hourWeights = [2,1,1,1,1,2,5,10,14,16,14,12,10,8,7,8,10,14,22,30,28,20,12,6];
    return {
      followers: 12480,
      mediaCount: 156,
      engagementRate: 4.7,
      username: 'activewear_il',
      bestHours: hourWeights.map((w, hour) => ({ hour, avgEngagement: w })),
      recentPosts: [
        { id: '1', likes: 342, comments: 28, timestamp: '2026-04-10T18:00:00Z', type: 'REEL' },
        { id: '2', likes: 518, comments: 45, timestamp: '2026-04-08T19:00:00Z', type: 'REEL' },
        { id: '3', likes: 289, comments: 22, timestamp: '2026-04-06T17:00:00Z', type: 'IMAGE' },
        { id: '4', likes: 401, comments: 33, timestamp: '2026-04-04T20:00:00Z', type: 'CAROUSEL_ALBUM' },
        { id: '5', likes: 677, comments: 61, timestamp: '2026-04-02T18:30:00Z', type: 'REEL' },
        { id: '6', likes: 229, comments: 18, timestamp: '2026-03-31T09:00:00Z', type: 'IMAGE' },
      ],
    };
  }
}
