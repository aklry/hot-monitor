import { Injectable, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "../database/prisma.service"

const DEFAULT_SOURCES = [
  {
    name: "Hacker News",
    type: "hacker_news",
    url: "builtin:hacker-news",
    weight: 80
  },
  {
    name: "GitHub Trending",
    type: "github_trending",
    url: "builtin:github-trending",
    weight: 85
  },
  {
    name: "X Recent Search",
    type: "x",
    url: "builtin:x-recent-search",
    weight: 75
  },
  {
    name: "OpenAI News",
    type: "rss",
    url: "https://openai.com/news/rss.xml",
    weight: 70
  },
  {
    name: "GitHub Blog",
    type: "rss",
    url: "https://github.blog/feed/",
    weight: 65
  },
  {
    name: "Product Hunt",
    type: "rss",
    url: "https://www.producthunt.com/feed",
    weight: 75
  }
]

const RSSHUB_SOURCES = [
  {
    name: "Weibo Hot Search",
    path: "/weibo/search/hot",
    weight: 70
  },
  {
    name: "Zhihu Hotlist",
    path: "/zhihu/hotlist",
    weight: 70
  }
]

@Injectable()
export class SourceSeedService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async onModuleInit() {
    for (const source of [...DEFAULT_SOURCES, ...this.rssHubSources()]) {
      await this.prisma.source.upsert({
        where: {
          type_url: {
            type: source.type,
            url: source.url
          }
        },
        update: {},
        create: {
          name: source.name,
          type: source.type,
          url: source.url,
          weight: source.weight
        }
      })
    }
  }

  private rssHubSources() {
    const baseUrl = this.config.get<string>("RSSHUB_BASE_URL") ?? "https://rsshub.app"
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, "")

    return RSSHUB_SOURCES.map((source) => ({
      name: source.name,
      type: "rss",
      url: `${normalizedBaseUrl}${source.path}`,
      weight: source.weight
    }))
  }
}
