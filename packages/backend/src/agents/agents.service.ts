import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';

const SYSTEM_PROMPT = `אתה מומחית תוכן לאינסטגרם עבור מותג ספורטוויר ישראלי לנשים.
הנישה: ביגוד ספורט לנשים ישראליות — לגינסים, חזיות ספורט, אימוניות, אורח חיים פעיל.
הקהל: נשים ישראליות גילאי 20–45, דוברות עברית, אוהבות כושר, אופנה ובריאות.
תמיד כתבי בעברית. הטון: חברותי, מעצים, אותנטי, קצת הומור — כמו חברה טובה שמכירה בכושר.
המטרה: תוכן ויראלי שמגביר מעורבות, מושך עוקבות חדשות ומחזק את המותג.`;

@Injectable()
export class AgentsService {
  private client: Anthropic;

  constructor(private prisma: PrismaService) {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  async generateScript(mediaIds: string[], contentType: string, niche: string): Promise<{ result: string }> {
    const prompt = `צרי סקריפט ויראלי לאינסטגרם.
סוג תוכן: ${contentType}
נישה: ${niche}
מדיה נבחרת: ${mediaIds.length} קבצים

הסקריפט חייב לכלול:

**Hook (0-3 שניות)** — משפט אחד שמעצור גלילה
**Body (3-45 שניות)** — תוכן ערכי, ממוספר, קצר
**CTA** — קריאה לפעולה ברורה
**Caption** — טקסט לפוסט עם אמוג'ים, עד 150 מילה
**3 גרסאות Hook חלופיות**

כתבי בעברית בלבד, טון חברותי ומעצים.`;

    try {
      const stream = this.client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });
      const message = await (await stream).finalMessage();
      const text = message.content[0]?.type === 'text' ? message.content[0].text : null;
      if (text) return { result: text };
    } catch {}

    return { result: this.demoScript(contentType) };
  }

  async generateCapCut(script: string, style: string): Promise<{ result: string }> {
    const prompt = `צרי הוראות CapCut שלב-אחר-שלב בעברית לסרטון אינסטגרם.
סגנון עריכה: ${style}
סקריפט: ${script}

כל שלב חייב לכלול:
- שם השלב עם מספר
- פעולות ספציפיות עם פרמטרים מדויקים
- זמנים, מעברים, אפקטים
- המלצות מוזיקה ממגמות TikTok/Reels
- טיפים לצבע וסגנון

פרמטי 8-12 שלבים. עברית בלבד.`;

    try {
      const stream = this.client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });
      const message = await (await stream).finalMessage();
      const text = message.content[0]?.type === 'text' ? message.content[0].text : null;
      if (text) return { result: text };
    } catch {}

    return { result: this.demoCapCut(style) };
  }

  async generateHashtags(script: string): Promise<{ hashtags: string[] }> {
    const prompt = `צרי בדיוק 20 האשטגים אופטימליים לפוסט הבא. שילוב עברית ואנגלית.

סקריפט: ${script}

כללים:
- 10 בעברית, 10 באנגלית
- מעורב: גדולים (מיליון+), בינוניים (100K-1M), קטנים-נישתיים (<100K)
- רלוונטיים לספורטוויר נשים ישראל
- כל האשטג בשורה נפרדת, מתחיל ב-#
- ללא מספרים, ללא הסברים`;

    try {
      const stream = this.client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });
      const message = await (await stream).finalMessage();
      if (message.content[0]?.type === 'text') {
        const tags = message.content[0].text
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.startsWith('#'));
        if (tags.length >= 5) return { hashtags: tags.slice(0, 20) };
      }
    } catch {}

    return { hashtags: this.demoHashtags() };
  }

  async saveScript(
    content: string,
    contentType: string,
    niche: string,
    mediaId?: string,
  ) {
    return this.prisma.script.create({
      data: { content, contentType, niche, mediaId },
    });
  }

  private demoScript(contentType: string): string {
    return `🎬 סקריפט ויראלי — ${contentType}

**Hook (0-3 שניות):**
"90% מהנשים לא יודעות את הטריק הזה... 😱"

**Body (3-45 שניות):**
שלב 1: "הלגינס הנכון משנה הכל — כך תדעי שהוא מתאים"
שלב 2: "3 סימנים ללגינס איכותי: בד אטום ✓ תפרים שטוחים ✓ מותן גבוה ✓"
שלב 3: הדגמה של הפריטים שלנו בפעולה — 3 תנוחות כושר

**CTA:**
"שמרי את הפוסט ✨ ועדכני אותנו מה הסגנון האהוב עליך 👇"

**Caption:**
כי את מגיעה ללגינס שישאר עליך גם אחרי 1,000 כיבוסים 💪✨
הגיע הזמן לשדרג את ארדרוב הכושר שלך 👑
קישור בביו 🔗 | משלוח חינם מ-200₪

#ספורטוויר #לגינס_איכותי #כושר_נשים #activewear_il

**Hook חלופיות:**
1. "הסוד שהמאמנות שלי לא מספרות לך..."
2. "שינוי אחד שיהפוך כל אימון 🔥"
3. "לגינס שנראה טוב גם בזום וגם בג'ים 😂"`;
  }

  private demoCapCut(style: string): string {
    return `📱 הוראות CapCut — ${style}

**שלב 1: פתיחת פרויקט**
☐ פתחי CapCut → New Project
☐ ייבאי את הקליפים לפי סדר הסקריפט
☐ הגדירי יחס: 9:16 (Reels/TikTok)

**שלב 2: Hook (0-3 שניות)**
☐ חתכי את הקליפ הראשון ל-3 שניות בדיוק
☐ הוסיפי Zoom In: Settings → Speed → 1.1x
☐ טקסט: כתבי את ה-Hook — גופן Bold, גודל 52
☐ אנימציה: Typewriter effect, מהירות: Fast
☐ צבע טקסט: לבן עם Outline שחור (עובי 4)

**שלב 3: Body (3-40 שניות)**
☐ מעברים בין קליפים: Slide → Duration: 0.3s
☐ הפעילי Auto Captions → בחרי סגנון Karaoke
☐ מוזיקה: חפשי "girl boss workout 2025" → Volume: 25%
☐ Stickers: חצי מצחיק בין שלבים

**שלב 4: CTA (40-45 שניות)**
☐ טקסט: "שמרי ❤️ ועקבי לעוד טיפים"
☐ אנימציה: Bounce → מהירות: Medium
☐ Fade Out אחרון: 0.5 שניות

**שלב 5: צבע ואפקטים**
☐ Filters: Vivid → עוצמה 35%
☐ Adjustments: Brightness +8, Contrast +5, Saturation +20
☐ Beauty: פנים → עוצמה 30% (לא מוגזם)

**שלב 6: מוזיקה סופית**
☐ חפשי "trending reels music Hebrew" ב-TikTok Sound
☐ חתכי לאורך הסרטון + Fade Out 2 שניות אחרונות

**שלב 7: ייצוא**
☐ Export → 1080×1920 → 30fps → Quality: Recommended
☐ שמרי לגלריה ✓`;
  }

  async generateCarousel(
    script: string,
    brandName: string,
    niche: string,
  ): Promise<{ slides: Array<{ type: string; title: string; body: string; emoji: string }> }> {
    const prompt = `בהתבסס על הסקריפט הבא, צרי תוכן ל-6 שקופיות קרוסל אינסטגרם לברנד "${brandName}".
נישה: ${niche}
סקריפט: ${script}

החזירי JSON בלבד (ללא markdown) במבנה:
{"slides":[
  {"type":"hook","title":"כותרת מושכת","body":"תת-כותרת/שאלה","emoji":"🔥"},
  {"type":"problem","title":"הבעיה","body":"תיאור הכאב ב-2 משפטים","emoji":"😤"},
  {"type":"solution","title":"הפתרון","body":"תועלת ספציפית","emoji":"✨"},
  {"type":"solution","title":"יתרון נוסף","body":"תועלת נוספת","emoji":"💪"},
  {"type":"proof","title":"תוצאות","body":"מספרים/עדות","emoji":"🏆"},
  {"type":"cta","title":"מה עכשיו","body":"קריאה לפעולה אחת","emoji":"👇"}
]}
עברית בלבד. כותרת: עד 6 מילים. גוף: עד 20 מילים.`;

    try {
      const stream = this.client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });
      const message = await (await stream).finalMessage();
      if (message.content[0]?.type === 'text') {
        const raw = message.content[0].text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(raw);
        if (parsed.slides?.length) return parsed;
      }
    } catch {}

    return { slides: this.demoCarousel(brandName) };
  }

  private demoCarousel(brandName: string) {
    return [
      { type: 'hook',     emoji: '🔥', title: '90% מהנשים עושות את הטעות הזו',   body: 'בחירת לגינס לא נכונה הורסת כל אימון' },
      { type: 'problem',  emoji: '😤', title: 'הלגינס שלך בוגד בך',              body: 'שקוף, נופל, לא שומר מקום — מכירה את זה?' },
      { type: 'solution', emoji: '✨', title: 'בד שלא בוגד',                     body: 'טכנולוגיית 4-way stretch שנשארת במקום בכל תנועה' },
      { type: 'solution', emoji: '💪', title: 'מותן גבוה שמחזיק הכל',            body: 'פס מותן רחב 10 ס"מ — בטן שטוחה בכל זווית' },
      { type: 'proof',    emoji: '🏆', title: '+2,400 נשים כבר בחרו',            body: '4.9 כוכבים · משלוח חינם · החלפה ללא שאלות' },
      { type: 'cta',      emoji: '👇', title: 'הגיע הזמן לשדרג',                 body: `קישור בביו של ${brandName} · משלוח עד 3 ימים` },
    ];
  }

  private demoHashtags(): string[] {
    return [
      '#ספורטוויר', '#לגינס_נשים', '#כושר_נשים', '#אורח_חיים_בריא',
      '#אימון_יומי', '#מוטיבציה_כושר', '#ביגוד_ספורט_ישראל', '#נשים_חזקות',
      '#חיים_בריאים', '#כושר_ישראל',
      '#activewear', '#fitnesswear', '#leggings', '#sportswear',
      '#israelifitness', '#workoutstyle', '#gymwear', '#fitnessfashion',
      '#womensactivewear', '#fitlife',
    ];
  }
}
