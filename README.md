# Digital Poker App (POC)

This is a proof-of-concept application for a digital poker app that replaces physical cards in a live poker setting. The app displays community cards on a large shared screen and sends private pocket cards to each player's mobile device.

## Features

- Home page to create and view active tables
- Dynamic table creation with unique identifiers (GUIDs)
- Player seating via QR code scanning
- Private pocket card delivery to players' devices
- Real-time updates using Server-Sent Events (SSE)
- Persistence of table states to disk
- Support for multiple tables and players
- Texas Hold'em game flow (Pre-Flop → Flop → Turn → River → Next Hand)

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/digital-poker-app.git
cd digital-poker-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Table

1. On the home page, click "Create New Table"
2. You'll be redirected to the table page

### Joining a Table as a Player

1. On the table page, scan the QR code with your mobile device
2. Alternatively, share the join link with players
3. Once a player joins, they'll be redirected to their player page showing their pocket cards

### Advancing the Game

1. On the table screen, press the Space or Enter key to advance through game phases
2. Alternatively, click the "Advance Game" button
3. The game progresses through Pre-Flop → Flop → Turn → River → Next Hand

## Technical Details

- Built with Next.js and TypeScript
- Uses Server-Sent Events (SSE) for real-time updates
- Table states are stored as JSON files in the `tables` directory
- Cards are dealt using a cryptographically secure shuffling algorithm
- Responsive design for both the table display and player devices

## Deployment

For the POC, the application runs locally on a single developer laptop:

```bash
npm run build
npm start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.