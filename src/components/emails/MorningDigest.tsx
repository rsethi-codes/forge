import * as React from 'react'
import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
    Link,
    Button,
} from '@react-email/components'

interface MorningDigestEmailProps {
    dayNumber: number | string
    streak: number
    disciplineScore: number
    tasks: string[]
}

export const MorningDigestEmail = ({
    dayNumber,
    streak,
    disciplineScore,
    tasks,
}: MorningDigestEmailProps) => (
    <Html>
        <Head />
        <Preview>{`FORGE: Day ${dayNumber} - The Grind Continues`}</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={headerSection}>
                    <Heading style={h1}>Day {dayNumber}</Heading>
                    <Text style={sub}>The Forge is Hot.</Text>
                </Section>

                <Section style={statsSection}>
                    <div style={statBox}>
                        <Text style={statLabel}>Current Streak</Text>
                        <Text style={statValue}>{streak} Days</Text>
                    </div>
                    <div style={statBox}>
                        <Text style={statLabel}>Discipline Score</Text>
                        <Text style={statValue}>{disciplineScore}%</Text>
                    </div>
                </Section>

                <Hr style={hr} />

                <Section style={tasksSection}>
                    <Heading style={h2}>Today&apos;s Focus</Heading>
                    {tasks.map((task, i) => (
                        <Text key={i} style={taskItem}>• {task}</Text>
                    ))}
                </Section>

                <Section style={buttonSection}>
                    <Button
                        style={{ ...button, padding: '12px 20px' }}
                        href="https://forge-2026.vercel.app/dashboard"
                    >
                        Launch Dashboard
                    </Button>
                </Section>

                <Text style={footer}>
                    Raghav&apos;s Forge 2026. Automated Performance Records.
                </Text>
            </Container>
        </Body>
    </Html>
)

const main = {
    backgroundColor: '#0a0a0a',
    color: '#ffffff',
    fontFamily: 'System-ui, sans-serif',
}

const container = {
    margin: '0 auto',
    padding: '40px 20px',
    width: '600px',
    maxWidth: '100%',
}

const headerSection = {
    textAlign: 'center' as const,
    marginBottom: '40px'
}

const h1 = {
    color: '#ff3e3e',
    fontSize: '48px',
    fontWeight: 'bold',
    margin: '0',
}

const h2 = {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px'
}

const sub = {
    color: '#888888',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
}

const statsSection = {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '40px'
}

const statBox = {
    backgroundColor: '#111111',
    border: '1px solid #222222',
    padding: '20px',
    borderRadius: '16px',
    textAlign: 'center' as const,
    minWidth: '140px'
}

const statLabel = {
    color: '#888888',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    marginBottom: '4px'
}

const statValue = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0'
}

const tasksSection = {
    marginBottom: '40px'
}

const taskItem = {
    color: '#cccccc',
    fontSize: '16px',
    marginBottom: '12px'
}

const hr = {
    borderColor: '#222',
    margin: '40px 0',
}

const buttonSection = {
    textAlign: 'center' as const,
}

const button = {
    backgroundColor: '#ff3e3e',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
}

const footer = {
    color: '#666',
    fontSize: '12px',
    textAlign: 'center' as const,
    marginTop: '60px',
}
