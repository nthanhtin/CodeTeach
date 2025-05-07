# LeetCode Problems Dataset JSON Structure

This folder contains `leetcode_problems.json`, a JSON array of coding problems converted from the original CSV dataset. Each object in the array represents a coding problem with the following fields:

## Schema
- **id**: Problem ID (string or number)
- **title**: Problem name/title
- **description**: Full markdown/text description of the problem, including example inputs/outputs
- **is_premium**: `true` if the problem requires a LeetCode premium account, otherwise `false`
- **difficulty**: One of `Easy`, `Medium`, or `Hard`
- **solution_link**: Path to the official solution or article (string, may be empty)
- **acceptance_rate**: Percentage of correct submissions (string or number)
- **frequency**: How often the problem is attempted (string or number)
- **url**: Full URL to the problem on LeetCode
- **discuss_count**: Number of user discussion threads/comments (string or number)
- **accepted**: Number of accepted submissions (string or number, e.g., '1.9M')
- **submissions**: Number of total submissions (string or number, e.g., '5.2M')
- **companies**: Array of company names that have asked this problem (array of strings)
- **related_topics**: Array of related topics/tags (array of strings)
- **likes**: Number of likes (integer)
- **dislikes**: Number of dislikes (integer)
- **rating**: Calculated as `likes / (likes + dislikes)`, or `null` if not available
- **asked_by_faang**: `true` if the problem was asked by Facebook, Apple, Amazon, Google, or Netflix; otherwise `false`
- **similar_questions**: Array of similar problems, each with:
  - **name**: Problem name
  - **slug**: Problem slug (for URL)
  - **difficulty**: Difficulty (Easy/Medium/Hard)

## Example Entry
```json
{
  "id": "1",
  "title": "Two Sum",
  "description": "Given an array of integers ...",
  "is_premium": false,
  "difficulty": "Easy",
  "solution_link": "/articles/two-sum",
  "acceptance_rate": "45.7",
  "frequency": "100.0",
  "url": "https://leetcode.com/problems/two-sum",
  "discuss_count": "1234",
  "accepted": "2.3M",
  "submissions": "5.0M",
  "companies": ["Google", "Amazon"],
  "related_topics": ["Array", "Hash Table"],
  "likes": 35000,
  "dislikes": 1000,
  "rating": 0.972,
  "asked_by_faang": true,
  "similar_questions": [
    {"name": "3Sum", "slug": "3sum", "difficulty": "Medium"}
  ]
}
```

---

For questions about the dataset or suggestions for improvement, please update this README or contact the project maintainer.
