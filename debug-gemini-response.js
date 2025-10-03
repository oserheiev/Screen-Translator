// Debug script to test Gemini response parsing
const testResponses = [
  // Case 1: JSON wrapped in markdown code blocks
  '```json\n{"originalText": "Hello World", "translatedText": "Hola Mundo"}\n```',
  
  // Case 2: JSON wrapped in generic code blocks
  '```\n{"originalText": "Hello World", "translatedText": "Hola Mundo"}\n```',
  
  // Case 3: Plain JSON
  '{"originalText": "Hello World", "translatedText": "Hola Mundo"}',
  
  // Case 4: JSON with extra text
  'Here is the extracted text:\n\n{"originalText": "Hello World", "translatedText": "Hola Mundo"}\n\nI hope this helps!',
  
  // Case 5: Malformed response
  'I found the text "Hello World" and translated it to "Hola Mundo"'
];

function parseGeminiResponse(responseText) {
  console.log('\n=== Testing Response ===');
  console.log('Raw response:', responseText);
  console.log('Response type:', typeof responseText);
  console.log('Response length:', responseText.length);
  
  try {
    // Check if response is wrapped in markdown code blocks
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json') && cleanedResponse.endsWith('```')) {
      console.log('Response is wrapped in markdown code blocks, extracting JSON...');
      cleanedResponse = cleanedResponse.slice(7, -3).trim(); // Remove ```json and ```
      console.log('Cleaned response:', cleanedResponse);
    } else if (cleanedResponse.startsWith('```') && cleanedResponse.endsWith('```')) {
      console.log('Response is wrapped in generic code blocks, extracting content...');
      cleanedResponse = cleanedResponse.slice(3, -3).trim(); // Remove ``` and ```
      console.log('Cleaned response:', cleanedResponse);
    }
    
    // Try to parse the JSON response
    const parsed = JSON.parse(cleanedResponse);
    console.log('✅ Successfully parsed JSON response:', parsed);
    console.log('originalText:', parsed.originalText);
    console.log('translatedText:', parsed.translatedText);
    return parsed;
  } catch (parseError) {
    console.log('❌ JSON parsing failed with error:', parseError.message);
    console.log('Attempting to extract text manually...');
    
    // Try to extract JSON from the response manually
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        console.log('Found JSON pattern, attempting to parse:', jsonMatch[0]);
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed extracted JSON:', parsed);
        return parsed;
      } catch (secondParseError) {
        console.log('❌ Second JSON parse attempt failed:', secondParseError.message);
      }
    }
    
    console.log('⚠️ All JSON parsing attempts failed, using raw response as fallback');
    // If parsing fails, create a structured response manually
    return {
      originalText: responseText,
      translatedText: responseText
    };
  }
}

// Test all response formats
testResponses.forEach((response, index) => {
  console.log(`\n🧪 TEST CASE ${index + 1}:`);
  const result = parseGeminiResponse(response);
  console.log('Final result:', result);
});