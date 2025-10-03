import { http, HttpResponse } from 'msw';

// Define request handlers for MSW
export const handlers = [
  // Mock Gemini AI API
  http.post('https://generativelanguage.googleapis.com/v1beta/models/*', () => {
    return HttpResponse.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'Mocked translation response from Gemini AI'
              }
            ]
          },
          finishReason: 'STOP',
          index: 0,
          safetyRatings: [
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              probability: 'NEGLIGIBLE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              probability: 'NEGLIGIBLE'
            },
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              probability: 'NEGLIGIBLE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              probability: 'NEGLIGIBLE'
            }
          ]
        }
      ],
      promptFeedback: {
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE'
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE'
          }
        ]
      }
    });
  }),

  // Mock any other external APIs that might be used
  http.get('https://api.example.com/*', () => {
    return HttpResponse.json({
      message: 'Mocked API response'
    });
  }),

  // Mock error responses for testing error handling
  http.post('https://generativelanguage.googleapis.com/v1beta/models/error', () => {
    return HttpResponse.json(
      {
        error: {
          code: 400,
          message: 'Invalid API key',
          status: 'INVALID_ARGUMENT'
        }
      },
      { status: 400 }
    );
  })
];