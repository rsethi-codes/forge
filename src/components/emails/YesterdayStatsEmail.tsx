
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
    Button,
} from '@react-email/components'

interface YesterdayStatsEmailProps {
    date: string
    dayNumber: number
    disciplineScore: number
    hoursLogged: string
    tasksCompleted: number
    tasksTotal: number
}

export const YesterdayStatsEmail = ({
    date,
    dayNumber,
    disciplineScore,
    hoursLogged,
    tasksCompleted,
    tasksTotal
}: YesterdayStatsEmailProps) => (
    <Html>
        <Head />
        <Preview>{`Summary: Day ${dayNumber} Stats - Score: ${disciplineScore}`}</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={headerSection}>
                    <Heading style={h1}>DAILY POST-MORTEM</Heading>
                    <Text style={sub}>{date} • Protocol Day {dayNumber}</Text>
                </Section>

                <Section style={scoreSection}>
                    <Text style={scoreLabel}>FINAL DISCIPLINE INDEX</Text>
                    <Text style={scoreValue}>{disciplineScore}</Text>
                </Section>

                <Section style={gridSection}>
                    <div style={statBox}>
                        <Text style={statLabel}>EFFORT</Text>
                        <Text style={statValue}>{hoursLogged}h</Text>
                    </div>
                    <div style={statBox}>
                        <Text style={statLabel}>EXECUTION</Text>
                        <Text style={statValue}>{tasksCompleted}/{tasksTotal}</Text>
                    </div>
                </Section>

                <Hr style={hr} />

                <Section style={messageSection}>
                    <Text style={message}>
                        The data has been archived. Your performance yesterday defines your baseline today.
                    </Text>
                </Section>

                <Section style={buttonSection}>
                    <Button
                        style={{ ...button, padding: '14px 24px' }}
                        href="https://forge-2026.vercel.app/dashboard"
                    >
                        View Full Analysis
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
    marginBottom: '32px'
}

const h1 = {
    color: '#ffffff',
    fontSize: '32px',
    fontWeight: 'black',
    margin: '0',
    letterSpacing: '-1px',
}

const sub = {
    color: '#888888',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
    marginTop: '4px',
}

const scoreSection = {
    textAlign: 'center' as const,
    marginBottom: '32px',
    padding: '30px',
    backgroundColor: '#111',
    borderRadius: '24px',
    border: '1px solid #222'
}

const scoreLabel = {
    color: '#ff3e3e',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '3px',
    marginBottom: '8px'
}

const scoreValue = {
    color: '#ffffff',
    fontSize: '64px',
    fontWeight: 'black',
    margin: '0',
    lineHeight: '1'
}

const gridSection = {
    display: 'flex' as any,
    gap: '16px',
    marginBottom: '32px'
}

const statBox = {
    flex: 1,
    backgroundColor: '#0c0c0c',
    border: '1px solid #1a1a1a',
    padding: '16px',
    borderRadius: '16px',
    textAlign: 'center' as const
}

const statLabel = {
    color: '#555',
    fontSize: '9px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    marginBottom: '4px'
}

const statValue = {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0'
}

const hr = {
    borderColor: '#222',
    margin: '32px 0',
}

const messageSection = {
    textAlign: 'center' as const,
    marginBottom: '32px'
}

const message = {
    color: '#888',
    fontSize: '14px',
    lineHeight: '1.6'
}

const buttonSection = {
    textAlign: 'center' as const,
}

const button = {
    backgroundColor: '#fff',
    borderRadius: '12px',
    color: '#000',
    fontSize: '13px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    textTransform: 'uppercase' as const,
}

const footer = {
    color: '#444',
    fontSize: '10px',
    textAlign: 'center' as const,
    marginTop: '60px',
}
