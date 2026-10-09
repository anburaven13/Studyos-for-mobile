import { GoogleGenAI } from '@google/genai';

export const setupExamModeRoutes = (app: any, sql: any, authenticateToken: any, aiLimiter: any) => {
  
  app.get('/api/exam-mode/syllabi', authenticateToken, async (req: any, res: any) => {
    try {
      const { board, class_level, academic_year, subject } = req.query;
      const syllabi = await sql`
        SELECT * FROM exam_mode_syllabi 
        WHERE board = ${board} AND class_level = ${class_level} 
          AND academic_year = ${academic_year} AND subject = ${subject}
      `;
      
      if (syllabi.length === 0) return res.json({ chapters: [] });
      
      const syllabusId = syllabi[0].id;
      const chapters = await sql`
        SELECT c.*, 
          COALESCE(json_agg(t.* ORDER BY t.order_index) FILTER (WHERE t.id IS NOT NULL), '[]') as topics
        FROM exam_mode_chapters c
        LEFT JOIN exam_mode_topics t ON t.chapter_id = c.id
        WHERE c.syllabus_id = ${syllabusId}
        GROUP BY c.id
        ORDER BY c.order_index
      `;
      
      res.json({ syllabus: syllabi[0], chapters });
    } catch (error) {
      console.error('Fetch syllabi error:', error);
      res.status(500).json({ error: 'Failed to fetch syllabus' });
    }
  });

  app.post('/api/exam-mode/syllabi/sync', authenticateToken, aiLimiter, async (req: any, res: any) => {
    try {
      const { subject, source_text, board, class_level, academic_year } = req.body;
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an expert curriculum analyzer. Parse the following syllabus into a structured JSON format.
Board: ${board}, Class: ${class_level}, Year: ${academic_year}, Subject: ${subject}

Respond ONLY with valid JSON in this schema:
{
  "chapters": [
    {
      "name": "Chapter Name",
      "order_index": 1,
      "topics": [
        { "name": "Topic 1", "order_index": 1 }
      ]
    }
  ]
}

Syllabus Text:
${source_text}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const parsed = JSON.parse(response.text!);

      const insertedSyllabus = await sql`
        INSERT INTO exam_mode_syllabi (board, class_level, academic_year, subject, source_type)
        VALUES (${board}, ${class_level}, ${academic_year}, ${subject}, 'AI_PARSED')
        ON CONFLICT (board, class_level, academic_year, subject) 
        DO UPDATE SET retrieved_at = CURRENT_TIMESTAMP
        RETURNING id
      `;
      const syllabusId = insertedSyllabus[0].id;
      
      await sql`DELETE FROM exam_mode_chapters WHERE syllabus_id = ${syllabusId}`;

      for (const chapter of parsed.chapters) {
         const insertedChapter = await sql`
           INSERT INTO exam_mode_chapters (syllabus_id, name, order_index)
           VALUES (${syllabusId}, ${chapter.name}, ${chapter.order_index})
           RETURNING id
         `;
         const chapterId = insertedChapter[0].id;

         for (const topic of chapter.topics) {
           await sql`
             INSERT INTO exam_mode_topics (chapter_id, name, order_index)
             VALUES (${chapterId}, ${topic.name}, ${topic.order_index})
           `;
         }
      }
      
      res.json({ message: 'Syllabus synced successfully', syllabusId });
    } catch (error) {
      console.error('Syllabus sync error:', error);
      res.status(500).json({ error: 'Server error syncing syllabus' });
    }
  });

  app.get('/api/exam-mode/dashboard', authenticateToken, async (req: any, res: any) => {
    try {
      // 1. Get exams for this user
      const exams = await sql`SELECT * FROM exams WHERE user_id = ${req.user.userId} ORDER BY date ASC`;
      
      // 2. Fetch topic mastery to determine weak areas and readiness
      const mastery = await sql`
        SELECT m.*, t.name as topic_name, c.name as chapter_name
        FROM exam_mode_mastery m
        JOIN exam_mode_topics t ON m.topic_id = t.id
        JOIN exam_mode_chapters c ON t.chapter_id = c.id
        WHERE m.user_id = ${req.user.userId}
      `;

      res.json({
        exams,
        mastery,
        status: 'ON TRACK'
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: 'Failed to load exam dashboard' });
    }
  });

};
