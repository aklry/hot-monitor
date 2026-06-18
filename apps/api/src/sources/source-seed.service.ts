import { Injectable, OnModuleInit } from "@nestjs/common"
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

@Injectable()
export class SourceSeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    for (const source of DEFAULT_SOURCES) {
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
}
