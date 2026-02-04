# Live Chat Support Feature Documentation

## Overview
A complete live chat system that allows shop admins to communicate with super admins for customer support. The system includes real-time messaging, conversation management, and notification features.

## Features

### For Shop Admins
- **Chat Widget**: Floating chat button on all pages
- **Real-time Messaging**: Send and receive messages instantly
- **Unread Notifications**: Badge showing unread message count
- **Auto-create Conversation**: Automatically creates conversation on first message
- **Message History**: View all previous messages

### For Super Admins
- **Chat Management Page**: Dedicated page to manage all conversations
- **Conversation List**: View all active conversations with shops
- **Status Management**: Mark conversations as open, pending, or closed
- **Unread Indicators**: See unread message counts for each conversation
- **Real-time Updates**: Messages update automatically

## Backend Implementation

### Models

#### Conversation Model (`backend/models/Conversation.js`)
- Links shop admin with super admin
- Tracks conversation status (open, closed, pending)
- Stores unread counts for both parties
- Tracks last message timestamp

#### Message Model (`backend/models/Message.js`)
- Stores individual messages
- Links to conversation and sender
- Tracks read status
- Timestamps for creation and read

### API Endpoints

#### `GET /api/chat/conversations`
- Get all conversations for current user
- Super admin: sees all conversations
- Shop admin: sees only their conversation
- Returns conversations with unread counts

#### `GET /api/chat/conversations/:id`
- Get single conversation with all messages
- Automatically marks messages as read
- Includes shop and admin information

#### `POST /api/chat/conversations`
- Create new conversation (shop admin only)
- Auto-creates if doesn't exist

#### `POST /api/chat/messages`
- Send a new message
- Updates conversation last message
- Updates unread counts
- Validates user access

#### `GET /api/chat/messages/:conversationId`
- Get messages for a conversation
- Supports pagination with `limit` and `before` parameters
- Automatically marks messages as read

#### `PUT /api/chat/conversations/:id/status`
- Update conversation status (super admin only)
- Statuses: open, closed, pending

#### `GET /api/chat/unread-count`
- Get total unread message count for current user
- Used for notification badges

## Frontend Implementation

### Components

#### ChatWidget (`frontend/components/chat/ChatWidget.tsx`)
- Floating chat button (bottom-right)
- Only visible to shop admins
- Shows unread count badge
- Opens chat window on click
- Real-time message polling (every 3 seconds)
- Auto-scrolls to latest message

#### Chat Page (`frontend/app/super-admin/chat/page.tsx`)
- Full chat management interface
- Conversation list sidebar
- Chat window with message history
- Status management dropdown
- Real-time updates

### Real-time Updates

The system uses **polling** for real-time updates:
- Chat widget polls every 3 seconds when open
- Super admin chat page polls every 3 seconds
- Conversation list refreshes every 10 seconds
- Unread count checks every 30 seconds

**Note**: For production, consider implementing WebSockets for better performance and lower server load.

## Usage

### Shop Admin Flow

1. Shop admin sees floating chat button on any page
2. Clicks button to open chat widget
3. First message automatically creates conversation
4. Messages are sent and received in real-time
5. Unread badge updates automatically

### Super Admin Flow

1. Navigate to "Chat Support" in sidebar
2. See list of all conversations
3. Click conversation to view messages
4. Send responses
5. Update conversation status as needed

## Database Schema

### Conversation Collection
```javascript
{
  shop: ObjectId (ref: Shop),
  shopAdmin: ObjectId (ref: User),
  superAdmin: ObjectId (ref: User, optional),
  status: String (open/closed/pending),
  lastMessage: ObjectId (ref: Message),
  lastMessageAt: Date,
  unreadCount: {
    shopAdmin: Number,
    superAdmin: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Message Collection
```javascript
{
  conversation: ObjectId (ref: Conversation),
  sender: ObjectId (ref: User),
  senderRole: String (shop_admin/super_admin),
  content: String,
  isRead: Boolean,
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Security

- All endpoints require authentication (`protect` middleware)
- Shop admins can only access their own conversations
- Super admins can access all conversations
- Message validation (content required, conversation exists)
- Authorization checks on all operations

## Mobile Responsiveness

- Chat widget is fully responsive
- Chat window adapts to mobile screens
- Touch-friendly buttons and inputs
- Optimized for one-handed use

## Future Enhancements

1. **WebSocket Integration**: Replace polling with WebSockets for true real-time
2. **File Attachments**: Support image/file sharing
3. **Typing Indicators**: Show when user is typing
4. **Message Reactions**: Emoji reactions to messages
5. **Chat History Export**: Download conversation history
6. **Auto-responses**: Automated responses for common questions
7. **Chat Tags**: Categorize conversations
8. **Priority Levels**: Mark urgent conversations
9. **Chat Analytics**: Track response times, resolution rates
10. **Multi-language Support**: Translate messages

## Testing

### Test Scenarios

1. **Shop Admin Creates Conversation**
   - Send first message
   - Verify conversation created
   - Check unread count updates

2. **Super Admin Responds**
   - View conversation list
   - Open conversation
   - Send response
   - Verify shop admin receives message

3. **Real-time Updates**
   - Open chat on both sides
   - Send message from one side
   - Verify other side receives within 3 seconds

4. **Unread Counts**
   - Send message when recipient offline
   - Verify unread count increases
   - Open conversation
   - Verify unread count resets

5. **Status Management**
   - Super admin changes status
   - Verify status updates
   - Test all status transitions

## API Examples

### Create/Get Conversation (Shop Admin)
```javascript
POST /api/chat/conversations
Headers: Authorization: Bearer <token>
Response: { _id, shop, shopAdmin, status, ... }
```

### Send Message
```javascript
POST /api/chat/messages
Headers: Authorization: Bearer <token>
Body: {
  conversation: "conversation_id",
  content: "Hello, I need help with..."
}
Response: { _id, sender, content, createdAt, ... }
```

### Get Messages
```javascript
GET /api/chat/messages/:conversationId
Headers: Authorization: Bearer <token>
Query: ?limit=50&before=timestamp
Response: [ { _id, sender, content, createdAt, ... }, ... ]
```

### Get Unread Count
```javascript
GET /api/chat/unread-count
Headers: Authorization: Bearer <token>
Response: { unreadCount: 5 }
```

## Troubleshooting

### Messages Not Updating
- Check polling intervals are active
- Verify API endpoints are accessible
- Check browser console for errors
- Verify authentication token is valid

### Unread Count Not Updating
- Verify message `isRead` field updates
- Check conversation unread count updates
- Verify user role matches expected role

### Conversation Not Found
- Verify conversation exists in database
- Check user authorization
- Verify shop admin has active conversation

## Performance Considerations

- Polling interval: 3 seconds (adjustable)
- Message limit: 100 messages per load
- Conversation limit: 50 conversations per load
- Indexes on conversation and message collections
- Consider pagination for large message histories
