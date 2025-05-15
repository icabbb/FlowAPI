import { Edge, Node } from '@xyflow/react';
import type { KeyValueEntry } from '@/components/shared/key-value-editor';
import type { PathEntry } from '@/components/shared/path-list-editor';
import type { AuthConfig, BearerAuthConfig } from '@/components/shared/auth-settings';

import type { MappingRule } from '@/components/panels/transform-node-settings';
import type { ConditionRule } from '@/components/panels/conditional-node-settings';

// --- Base and Specific Node Data Interfaces ---
interface BaseNodeData {
  label?: string;
  tutorialText?: string;
  [key: string]: any;
}

interface HttpRequestNodeData extends BaseNodeData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  queryParams?: KeyValueEntry[];
  headers?: KeyValueEntry[];
  bodyType?: 'none' | 'json' | 'text'; 
  body?: string; 
  auth?: AuthConfig;
}

interface JsonNodeData extends BaseNodeData {
  inputData?: any; 
  width?: number; 
}

interface SelectFieldsNodeData extends BaseNodeData {
  jsonPaths?: PathEntry[];
}

interface VariableSetNodeData extends BaseNodeData {
  variableName?: string;
  variableValue?: string;
  target?: 'flowContext' | 'selectedEnvironment';
  markAsSecret?: boolean;
}

interface LoopNodeData extends BaseNodeData {
  inputArrayPath?: string;
}

interface TransformNodeData extends BaseNodeData {
  mappingRules?: MappingRule[];
}

interface ConditionalNodeData extends BaseNodeData {
  conditions?: ConditionRule[];
  defaultOutputHandleId?: string;
}

// --- Generate Unique ID Helper ---
const generateId = (): string => crypto.randomUUID();

// --- Default Header for ReqRes ---
const reqresApiKeyHeader: KeyValueEntry = {
  id: generateId(),
  key: 'x-api-key',
  value: 'reqres-free-v1',
  enabled: true,
};

// Define the tutorial workflow structure
export const TUTORIAL_WORKFLOW: {
  name: string;
  description: string;
  nodes: Node<HttpRequestNodeData | JsonNodeData | SelectFieldsNodeData>[];
  edges: Edge[];
} = {
  name: 'Welcome Tutorial',
  description: 'Examples of common node configurations.',
  nodes: [
    // --- Example 1: GET with Query Params ---
    {
      id: 'tut-get-params',
      type: 'httpRequest',
      position: { x: 50, y: 50 },
      data: {
        label: 'GET with Params',
        method: 'GET',
        url: 'https://httpbin.org/get',
        queryParams: [
          { id: 'qp1', key: 'source', value: 'tutorial', enabled: true },
          { id: 'qp2', key: 'active', value: 'true', enabled: true },
        ],
        headers: [], bodyType: 'none', body: '', auth: { type: 'none' },
        tutorialText: 'GET Request: Fetches data. Query parameters are added to the URL (e.g., ?source=tutorial). See the result in the connected JSON node.'
      },
    },
    {
      id: 'tut-json-get-params',
      type: 'jsonNode',
      position: { x: 400, y: 50 },
      data: {
        label: 'GET Result',
        width: 320,
        tutorialText: 'JSON Output: Displays the response from the GET request, including the query parameters sent.'
      },
    },

    // --- Example 2: POST with JSON Body ---
    {
      id: 'tut-post-json',
      type: 'httpRequest',
      position: { x: 50, y: 250 },
      data: {
        label: 'POST with JSON Body',
        method: 'POST',
        url: 'https://httpbin.org/post',
        headers: [
          { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }
        ],
        bodyType: 'json',
        body: JSON.stringify({ message: 'Hello from Flow Builder!', user: 123 }, null, 2),
        queryParams: [], auth: { type: 'none' },
        tutorialText: 'POST Request: Sends data. This example sends a JSON body. The \'Content-Type\' header is automatically set to \'application/json\'.'
      },
    },
    {
      id: 'tut-json-post-json',
      type: 'jsonNode',
      position: { x: 400, y: 250 },
      data: {
        label: 'POST Result',
        width: 320,
        tutorialText: 'JSON Output: Shows the response from the POST request, including the JSON data echoed back by httpbin.'
      },
    },

    // --- Example 3: PUT with Text Body ---
    {
      id: 'tut-put-text',
      type: 'httpRequest',
      position: { x: 50, y: 450 },
      data: {
        label: 'PUT with Text Body',
        method: 'PUT',
        url: 'https://httpbin.org/put',
        headers: [
           { id: 'h2', key: 'Content-Type', value: 'text/plain', enabled: true }
        ],
        bodyType: 'text',
        body: 'This is a plain text update.',
        queryParams: [], auth: { type: 'none' },
        tutorialText: 'PUT Request: Often used for updating resources. This example sends plain text. Note the \'Content-Type\' header.'
      },
    },
    {
      id: 'tut-json-put-text',
      type: 'jsonNode',
      position: { x: 400, y: 450 },
      data: {
        label: 'PUT Result',
        width: 320,
        tutorialText: 'JSON Output: Displays the result of the PUT request.'
      },
    },
    
    // --- Example 4: GET with Bearer Auth ---
    {
      id: 'tut-get-auth',
      type: 'httpRequest',
      position: { x: 50, y: 650 },
      data: {
        label: 'GET with Auth',
        method: 'GET',
        url: 'https://httpbin.org/bearer', // This endpoint specifically checks for Bearer token
        auth: { type: 'bearer', token: '{{YOUR_API_TOKEN}}' } as BearerAuthConfig, // Example using env variable
        queryParams: [], headers: [], bodyType: 'none', body: '',
        tutorialText: 'Authenticated GET: This uses Bearer Token authentication. The token \'{{YOUR_API_TOKEN}}\' would ideally be an environment variable. Check the Auth tab in settings!'
      },
    },
    {
      id: 'tut-json-get-auth',
      type: 'jsonNode',
      position: { x: 400, y: 650 },
      data: {
        label: 'Auth GET Result',
        width: 320,
        tutorialText: 'JSON Output: If authentication was successful, this shows the authenticated response.'
      },
    },

    // --- Example 5: Select Fields Flow ---
    {
      id: 'tut-http-select-src',
      type: 'httpRequest',
      position: { x: 750, y: 50 }, // Moved to the right
      data: {
        label: 'Fetch User Data',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/users/1',
        queryParams: [], headers: [], bodyType: 'none', body: '', auth: { type: 'none' },
        tutorialText: 'Step 1 (Chain): Fetch user data from a public API.'
      },
    },
    {
      id: 'tut-select-fields',
      type: 'selectFields',
      position: { x: 1100, y: 50 },
      data: {
        label: 'Select Name & Email',
        jsonPaths: [
          { id: 'p1', path: '$.name', enabled: true },
          { id: 'p2', path: '$.email', enabled: true },
        ],
        tutorialText: 'Step 2 (Chain): Use JSONPath to extract only the \'name\' and \'email\' fields from the fetched user data.'
      },
    },
    {
      id: 'tut-json-select-result',
      type: 'jsonNode',
      position: { x: 1450, y: 50 },
      data: {
        label: 'Selected Fields Result',
        width: 320,
        tutorialText: 'Step 3 (Chain): Displays the final result containing only the selected fields (name and email).'
      },
    },
  ],
  edges: [
    // Edges for Example 1
    { id: 'e-getp-json', source: 'tut-get-params', target: 'tut-json-get-params', type: 'animated', sourceHandle: 'output' },
    // Edges for Example 2
    { id: 'e-postj-json', source: 'tut-post-json', target: 'tut-json-post-json', type: 'animated', sourceHandle: 'output' },
    // Edges for Example 3
    { id: 'e-putt-json', source: 'tut-put-text', target: 'tut-json-put-text', type: 'animated', sourceHandle: 'output' },
    // Edges for Example 4
    { id: 'e-geta-json', source: 'tut-get-auth', target: 'tut-json-get-auth', type: 'animated', sourceHandle: 'output' },
    // Edges for Example 5
    { id: 'e-httpsrc-select', source: 'tut-http-select-src', target: 'tut-select-fields', type: 'animated', sourceHandle: 'output' },
    { id: 'e-select-jsonres', source: 'tut-select-fields', target: 'tut-json-select-result', type: 'animated', sourceHandle: 'output' },
  ],
};

// --- New Workflow Template: Node Test Flow ---
export const NODE_TEST_WORKFLOW: {
  name: string;
  description: string;
  nodes: Node<BaseNodeData>[]; // Use BaseNodeData as common type
  edges: Edge[];
} = {
  name: 'Node Test Flow',
  description: 'Fetches posts, comments, loops, filters conditionally, and sets variables.',
  nodes: [
    // 1. Fetch Post
    {
      id: 'test-fetch-post',
      type: 'httpRequest',
      position: { x: 50, y: 100 },
      data: {
        label: '1. Fetch Post /posts/1',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        auth: { type: 'none' },
        tutorialText: 'Fetch a single blog post.',
      } as HttpRequestNodeData,
    },
    // 2. Save Post ID to Context
    {
      id: 'test-set-post-id',
      type: 'variableSetNode',
      position: { x: 350, y: 100 },
      data: {
        label: '2. Set currentPostId',
        variableName: 'currentPostId',
        variableValue: '{{test-fetch-post::$.id}}', // Reference the ID from the previous node
        tutorialText: 'Save the fetched post ID (e.g., 1) into the context variable \'currentPostId\'.',
      } as VariableSetNodeData,
    },
    // 3. Fetch Comments using Context Variable
    {
      id: 'test-fetch-comments',
      type: 'httpRequest',
      position: { x: 650, y: 100 },
      data: {
        label: '3. Fetch Comments',
        method: 'GET',
        // Use the context variable in the URL
        url: 'https://jsonplaceholder.typicode.com/posts/{{context.currentPostId}}/comments',
        auth: { type: 'none' },
        tutorialText: 'Fetch comments for the post ID stored in context ({{context.currentPostId}}).',
      } as HttpRequestNodeData,
    },
    // 4. Loop Through Comments
    {
      id: 'test-loop-comments',
      type: 'loop',
      position: { x: 1000, y: 100 },
      data: {
        label: '4. Loop Comments',
        inputArrayPath: '$.*', // Iterate over the root array of comments
        tutorialText: 'Iterate through each comment object from the previous step.',
      } as LoopNodeData,
    },
    // 5. Conditional Check within Loop
    {
      id: 'test-conditional-email',
      type: 'conditionalNode',
      position: { x: 1300, y: 0 }, // Branching up
      data: {
        label: '5. Check Email Domain',
        conditions: [
          {
            id: 'cond-biz',
            // Check if the 'email' property (passed from loop) ends with .biz
            expression: '{{loopItem.email}}.endsWith(\'.biz\')',
            outputHandleId: 'true', // Handle ID for true condition
            enabled: true // Add required enabled property
          },
        ],
        defaultOutputHandleId: 'default', // Handle ID if condition is false
        tutorialText: 'Inside the loop: Check if the current comment\'s email ends with .biz.',
      } as ConditionalNodeData,
    },
    // 6a. Output for .biz Emails
    {
      id: 'test-output-biz',
      type: 'jsonNode',
      position: { x: 1650, y: -50 }, // Positioned higher
      data: {
        label: '6a. Biz Emails Output',
        width: 300,
        tutorialText: 'Displays comments where the email ends with .biz.',
      } as JsonNodeData,
    },
     // 6b. Output for Other Emails
    {
      id: 'test-output-other',
      type: 'jsonNode',
      position: { x: 1650, y: 100 }, // Positioned lower
      data: {
        label: '6b. Other Emails Output',
        width: 300,
        tutorialText: 'Displays comments where the email does NOT end with .biz.',
      } as JsonNodeData,
    },
    // 7. Output After Loop Finishes
    {
      id: 'test-output-after-loop',
      type: 'jsonNode',
      position: { x: 1300, y: 250 }, // Below the loop
      data: {
        label: '7. All Comments (End)',
        width: 350,
        tutorialText: 'After loop finishes: Displays the original full list of comments passed to the loop.',
      } as JsonNodeData,
    },
  ],
  edges: [
    // Connect Fetch Post -> Set Variable -> Fetch Comments -> Loop
    { id: 'e-1-2', source: 'test-fetch-post', target: 'test-set-post-id', type: 'animated', sourceHandle: 'output' },
    { id: 'e-2-3', source: 'test-set-post-id', target: 'test-fetch-comments', type: 'animated', sourceHandle: 'output' },
    { id: 'e-3-4', source: 'test-fetch-comments', target: 'test-loop-comments', type: 'animated', sourceHandle: 'output' },
    
    // Connect Loop Body -> Conditional
    { id: 'e-4body-5', source: 'test-loop-comments', target: 'test-conditional-email', type: 'animated', sourceHandle: 'loopBody' },
    
    // Connect Conditional -> Biz Output (True Handle)
    { id: 'e-5true-6a', source: 'test-conditional-email', target: 'test-output-biz', type: 'animated', sourceHandle: 'true' },

    // Connect Conditional -> Other Output (Default Handle)
    { id: 'e-5default-6b', source: 'test-conditional-email', target: 'test-output-other', type: 'animated', sourceHandle: 'default' },

    // Connect Loop End -> Final Output
    { id: 'e-4end-7', source: 'test-loop-comments', target: 'test-output-after-loop', type: 'animated', sourceHandle: 'loopEnd' },
  ],
}; 

// Template definition interface
export interface WorkflowTemplate {
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

// --- Workflow Templates Array ---
export const workflowTemplates: WorkflowTemplate[] = [
  {
    name: 'Basic HTTP Request',
    description: 'Fetches data from JSONPlaceholder and displays it.',
    nodes: [
      {
        id: 'template-http-1',
        type: 'httpRequest',
        position: { x: 100, y: 100 },
        data: {
          label: 'Fetch User Data',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/users/1',
          tutorialText: 'This node makes a GET request to fetch user data.'
        } as HttpRequestNodeData,
      },
      {
        id: 'template-json-1',
        type: 'jsonNode',
        position: { x: 450, y: 80 },
        data: {
          label: 'Display Output',
          width: 350,
          tutorialText: 'This node displays the JSON data received from the HTTP Request node.'
        } as JsonNodeData,
      },
    ],
    edges: [
      {
        id: 'e-http-json-1',
        source: 'template-http-1',
        target: 'template-json-1',
        type: 'animated',
      },
    ],
  },
  {
    name: 'Select Fields Example',
    description: 'Fetches user data, selects specific fields, and displays the result.',
    nodes: [
      {
        id: 'sf-http-1',
        type: 'httpRequest',
        position: { x: 50, y: 100 },
        data: {
          label: 'Fetch Users List',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/users',
          tutorialText: 'Fetch a list of users.'
        } as HttpRequestNodeData,
      },
      {
        id: 'sf-select-1',
        type: 'selectFields',
        position: { x: 350, y: 100 },
        data: {
          label: 'Select Names and Emails',
          jsonPaths: [
            { id: 'p1', path: '$[*].name', enabled: true },
            { id: 'p2', path: '$[*].email', enabled: true },
          ],
          tutorialText: 'Use JSONPath to extract only the name and email from each user object in the list.'
        } as SelectFieldsNodeData,
      },
      {
        id: 'sf-json-1',
        type: 'jsonNode',
        position: { x: 700, y: 80 },
        data: {
          label: 'Show Names & Emails',
          width: 400,
          tutorialText: 'Displays the extracted names and emails.'
        } as JsonNodeData,
      },
    ],
    edges: [
      {
        id: 'e-sf-http-select',
        source: 'sf-http-1',
        target: 'sf-select-1',
        type: 'animated',
      },
      {
        id: 'e-sf-select-json',
        source: 'sf-select-1',
        target: 'sf-json-1',
        type: 'animated',
      },
    ],
  },
  {
    name: 'Set Variable (Context)',
    description: 'Fetches data, extracts a value, and sets it as a variable in the flow context.',
    nodes: [
      {
        id: 'svc-http-1',
        type: 'httpRequest',
        position: { x: 50, y: 100 },
        data: {
          label: 'Fetch Todo Item',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/todos/1',
          tutorialText: 'Fetch a single todo item.'
        } as HttpRequestNodeData,
      },
      {
        id: 'svc-select-1',
        type: 'selectFields',
        position: { x: 350, y: 100 },
        data: {
          label: 'Extract Todo Title',
          jsonPaths: [{ id: 'p1', path: '$.title', enabled: true }],
          tutorialText: 'Extract the title field from the todo item.'
        } as SelectFieldsNodeData,
      },
      {
        id: 'svc-setvar-1',
        type: 'variableSetNode',
        position: { x: 650, y: 100 },
        data: {
          label: "Set 'todoTitle' Variable",
          variableName: 'todoTitle',
          variableValue: '{{svc-select-1::$.title}}', // Reference the output of selectFields
          target: 'flowContext', // Target the flow context (default)
          tutorialText: "Saves the extracted title into a variable named 'todoTitle' within this flow run\'s temporary context. Use {{context.todoTitle}} elsewhere."
        } as VariableSetNodeData,
      },
      {
        id: 'svc-json-1',
        type: 'jsonNode',
        position: { x: 950, y: 80 },
        data: {
          label: 'Show Context Set Result',
          width: 350,
          tutorialText: 'Displays the output after the variable has been set in the context (the node itself passes through the original input).',
        } as JsonNodeData,
      },
    ],
    edges: [
      { id: 'e-svc-http-select', source: 'svc-http-1', target: 'svc-select-1', type: 'animated' },
      { id: 'e-svc-select-setvar', source: 'svc-select-1', target: 'svc-setvar-1', type: 'animated' },
      { id: 'e-svc-setvar-json', source: 'svc-setvar-1', target: 'svc-json-1', type: 'animated' },
    ],
  },
  {
    name: 'Set Variable (Environment)',
    description: 'Fetches user email, sets it as a non-secret environment variable, and sets a static secret variable.',
    nodes: [
      {
        id: 'sve-http-1',
        type: 'httpRequest',
        position: { x: 50, y: 150 },
        data: {
          label: 'Fetch User 1',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/users/1',
          tutorialText: 'Fetch data for user 1.'
        } as HttpRequestNodeData,
      },
      {
        id: 'sve-select-email',
        type: 'selectFields',
        position: { x: 350, y: 150 },
        data: {
          label: 'Extract Email',
          jsonPaths: [{ id: 'p1', path: '$.email', enabled: true }],
          tutorialText: 'Extract the email address.'
        } as SelectFieldsNodeData,
      },
      {
        id: 'sve-set-env-email',
        type: 'variableSetNode',
        position: { x: 650, y: 50 }, // Position higher
        data: {
          label: 'Save Email to Env',
          variableName: 'user1Email', // Name for the environment variable
          variableValue: '{{sve-select-email::$.email}}', // Get email from selectFields
          target: 'selectedEnvironment', // <-- Save to environment
          markAsSecret: false, // <-- Not secret
          tutorialText: "TARGET: Environment (Not Secret). Saves the extracted email to the *currently selected* environment as 'user1Email'. It will NOT be encrypted."
        } as VariableSetNodeData,
      },
      {
        id: 'sve-set-env-secret',
        type: 'variableSetNode',
        position: { x: 650, y: 250 }, // Position lower
        data: {
          label: 'Save API Key to Env',
          variableName: 'myApiKey', // Name for the environment variable
          variableValue: 'super-secret-api-key', // Static value
          target: 'selectedEnvironment', // <-- Save to environment
          markAsSecret: true, // <-- Mark as SECRET
          tutorialText: "TARGET: Environment (SECRET!). Saves the static value \'super-secret-api-key\' to the *currently selected* environment as \'myApiKey\'. It WILL be encrypted."
        } as VariableSetNodeData,
      },
      {
        id: 'sve-json-out',
        type: 'jsonNode',
        position: { x: 950, y: 130 },
        data: {
          label: 'Show Final Output',
          width: 350,
          tutorialText: 'Displays the final output. The Set Variable nodes pass through the data from the Select Fields node.'
        } as JsonNodeData,
      },
    ],
    edges: [
      // Connect Http -> Select -- ADD sourceHandle
      { id: 'e-sve-http-select', source: 'sve-http-1', target: 'sve-select-email', type: 'animated', sourceHandle: 'output' },
      // Connect Select -> Set Email Env Var -- ADD sourceHandle
      { id: 'e-sve-select-setenvmail', source: 'sve-select-email', target: 'sve-set-env-email', type: 'animated', sourceHandle: 'output' },
      // Connect Select -> Set Secret Env Var -- ADD sourceHandle
      { id: 'e-sve-select-setenvsecret', source: 'sve-select-email', target: 'sve-set-env-secret', type: 'animated', sourceHandle: 'output' },
      // Connect Set Email Env Var -> Final Output -- ADD sourceHandle
      { id: 'e-sve-setenvmail-json', source: 'sve-set-env-email', target: 'sve-json-out', type: 'animated', sourceHandle: 'output' },
      // Connect Set Secret Env Var -> Final Output -- ADD sourceHandle
      { id: 'e-sve-setenvsecret-json', source: 'sve-set-env-secret', target: 'sve-json-out', type: 'animated', sourceHandle: 'output' },
    ],
  },
  // --- NEW ReqRes Template --- 
  {
    name: 'ReqRes Login & POST (Env Token)',
    description: 'Logs into ReqRes, saves token to Environment, then uses token for a POST.',
    nodes: [
      {
        id: 'reqres-login-env',
        type: 'httpRequest',
        position: { x: 100, y: 200 },
        data: {
          label: 'ReqRes Login',
          method: 'POST',
          url: 'https://reqres.in/api/login',
          headers: [
            { id: generateId(), key: 'Content-Type', value: 'application/json', enabled: true },
            reqresApiKeyHeader // Add the API key header
          ],
          bodyType: 'json',
          body: JSON.stringify({ email: 'eve.holt@reqres.in', password: '{{env.REQRES_PASSWORD}}' }), // Use env variable
          tutorialText: "Makes the login request. Uses an environment variable 'REQRES_PASSWORD' for the password. Create this variable in the Environment Manager.",
        } as HttpRequestNodeData,
      },
      {
        id: 'reqres-extract-token-env',
        type: 'selectFields',
        position: { x: 450, y: 200 },
        data: {
          label: "Extract Token",
          jsonPaths: [{ id: 'p-token', path: '$.token', enabled: true }],
          tutorialText: "Extracts the authentication token from the login response using JSONPath `$.token`.",
        } as SelectFieldsNodeData,
      },
      {
        id: 'reqres-save-token-env',
        type: 'variableSetNode',
        position: { x: 800, y: 200 },
        data: {
          label: "Save Token to Env",
          variableName: 'reqresToken',
          variableValue: '{{reqres-extract-token-env::$[0]}}', // Correctly reference the first element of the SelectFields output
          target: 'selectedEnvironment', // Target the environment
          markAsSecret: true, // Mark as secret
          tutorialText: "Saves the extracted token to the 'reqresToken' variable in the *selected environment*. It references the output of the 'Extract Token' node (using `$[0]`) and marks it as secret.",
        } as VariableSetNodeData,
      },
      {
        id: 'reqres-post-with-env-token',
        type: 'httpRequest',
        position: { x: 1150, y: 200 },
        data: {
          label: 'POST with Env Token',
          method: 'POST',
          url: 'https://reqres.in/api/users',
          headers: [
            { id: generateId(), key: 'Content-Type', value: 'application/json', enabled: true },
            // Use the environment variable in the Authorization header
            { id: generateId(), key: 'Authorization', value: 'Bearer {{env.reqresToken}}', enabled: true },
            reqresApiKeyHeader // Add the API key header
          ],
          bodyType: 'json',
          body: JSON.stringify({ name: 'testUser', job: 'tester' }),
          tutorialText: "Makes another POST request, this time authenticating using the 'reqresToken' environment variable fetched via `{{env.reqresToken}}` in the Authorization header.",
        } as HttpRequestNodeData,
      },
      {
        id: 'reqres-env-post-output',
        type: 'jsonNode',
        position: { x: 1500, y: 200 },
        data: { label: 'POST Response (Env Token)' } as JsonNodeData,
      },
    ],
    edges: [
      { id: 'e-login-extract-env', source: 'reqres-login-env', target: 'reqres-extract-token-env', type: 'animated', sourceHandle: 'output' },
      { id: 'e-extract-save-env', source: 'reqres-extract-token-env', target: 'reqres-save-token-env', type: 'animated', sourceHandle: 'output' },
      { id: 'e-save-post-env', source: 'reqres-save-token-env', target: 'reqres-post-with-env-token', sourceHandle: 'output', type: 'animated' },
      { id: 'e-post-output-env', source: 'reqres-post-with-env-token', target: 'reqres-env-post-output', type: 'animated', sourceHandle: 'output' },
    ],
  },
]; 

export const complexWorkflowExample: WorkflowTemplate = {
  name: "Complex Workflow Example",
  description: "Demonstrates a more complex flow: Get token, extract, prepare payload, POST, check status, and branch output.",
  nodes: [
    {
      id: 'complex-get-token',
      type: 'httpRequest',
      position: { x: 50, y: 100 },
      data: {
        label: '1. Get User Data (Simulates Token Source)',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/users/1',
        tutorialText: 'This node fetches user data. In a real scenario, this might be a login endpoint that returns a token.',
      } satisfies HttpRequestNodeData,
    },
    {
      id: 'complex-extract-token',
      type: 'selectFields',
      position: { x: 350, y: 100 },
      data: {
        label: '2. Extract Username (Simulates Token)',
        jsonPaths: [{ id: crypto.randomUUID(), path: '$.username', enabled: true }],
        tutorialText: 'This node extracts the username using JSONPath ($.username). We pretend this username is our authentication token for the later POST.',
      } satisfies SelectFieldsNodeData,
    },
    {
      id: 'complex-prepare-payload',
      type: 'transformNode',
      position: { x: 350, y: 250 },
      data: {
        label: '3. Prepare POST Payload',
        mappingRules: [
          { id: crypto.randomUUID(), inputPath: '$.name', outputPath: 'userName', enabled: true },
          { id: crypto.randomUUID(), inputPath: '$.email', outputPath: 'userEmail', enabled: true },
        ],
        tutorialText: 'This node transforms the *original* user data (from node 1) into a new structure using mapping rules.',
      } satisfies TransformNodeData,
    },
    {
      id: 'complex-post-data',
      type: 'httpRequest',
      position: { x: 700, y: 250 },
      data: {
        label: '4. POST Prepared Data',
        method: 'POST',
        url: 'https://jsonplaceholder.typicode.com/posts',
        bodyType: 'json',
        body: '{{complex-prepare-payload::$}}',
        headers: [
          { id: crypto.randomUUID(), key: 'Content-Type', value: 'application/json; charset=UTF-8', enabled: true },
          { id: crypto.randomUUID(), key: 'Authorization', value: 'Bearer {{complex-extract-token::$.username}}', enabled: true },
        ],
        tutorialText: 'Sends the transformed data via POST. It uses the output of node 3 as the body and the extracted username (token) from node 2 in the Authorization header.',
      } satisfies HttpRequestNodeData,
    },
    {
      id: 'complex-check-status',
      type: 'conditionalNode',
      position: { x: 1050, y: 250 },
      data: {
        label: '5. Check POST Status',
        conditions: [
          { id: crypto.randomUUID(), expression: '{{complex-post-data::statusCode}} == 201', outputHandleId: 'true', enabled: true },
        ],
        defaultOutputHandleId: 'default',
        tutorialText: 'Checks if the status code from the POST request (node 4) is 201 (Created). Uses the `true` handle if it matches, otherwise uses the `default` handle.',
      } satisfies ConditionalNodeData,
    },
    {
      id: 'complex-output-success',
      type: 'jsonNode',
      position: { x: 1400, y: 200 },
      data: {
        label: '6a. Output (Success)',
        width: 300,
        tutorialText: 'Shows the result received from the POST request if the status code was 201.',
      } satisfies JsonNodeData,
    },
    {
      id: 'complex-output-error',
      type: 'jsonNode',
      position: { x: 1400, y: 350 },
      data: {
        label: '6b. Output (Error/Default)',
        width: 300,
        tutorialText: 'Shows the result received from the POST request if the status code was *not* 201.',
      } satisfies JsonNodeData,
    },
  ],
  edges: [
    { id: 'cplx-e-1-2', source: 'complex-get-token', target: 'complex-extract-token', type: 'animated', sourceHandle: 'output' },
    { id: 'cplx-e-1-3', source: 'complex-get-token', target: 'complex-prepare-payload', type: 'animated', sourceHandle: 'output' },
    { id: 'cplx-e-3-4', source: 'complex-prepare-payload', target: 'complex-post-data', type: 'animated', sourceHandle: 'output' },
    { id: 'cplx-e-4-5', source: 'complex-post-data', target: 'complex-check-status', type: 'animated', sourceHandle: 'output' },
    { id: 'cplx-e-5true-6a', source: 'complex-check-status', target: 'complex-output-success', type: 'animated', sourceHandle: 'true' },
    { id: 'cplx-e-5default-6b', source: 'complex-check-status', target: 'complex-output-error', type: 'animated', sourceHandle: 'default' },
  ]
}; 