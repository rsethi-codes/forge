
import * as React from 'react'
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Button,
} from '@react-email/components'

interface ReminderEmailProps {
    quote: string
    author: string
}

export const ReminderEmail = ({
    quote,
    author,
}: ReminderEmailProps) => (
    <Html>
        <Head />
        <Preview>The Forge is waiting... Your journey hasn&apos;t started yet.</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={headerSection}>
                    <Heading style={h1}>START THE GRIND</Heading>
                    <Text style={sub}>The Strategy is Built. Now Execute.</Text>
                </Section>

                <Section style={quoteSection}>
                    <Text style={quoteText}>&quot;{quote}&quot;</Text>
                    <Text style={quoteAuthor}>— {author}</Text>
                </Section>

                <Section style={buttonSection}>
                    <Button
                        style={{ ...button, padding: '16px 24px' }}
                        href="https://forge-2026.vercel.app/dashboard"
                    >
                        Ignite Your Roadmap
                    </Button>
                </Section>

                <Text style={footer}>
                    Raghav&apos;s Forge 2026. Discipline is the bridge between goals and accomplishment.
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
    padding: '60px 20px',
    width: '600px',
    maxWidth: '100%',
}

const headerSection = {
    textAlign: 'center' as const,
    marginBottom: '48px'
}

const h1 = {
    color: '#ff3e3e',
    fontSize: '40px',
    fontWeight: 'black',
    margin: '0',
    letterSpacing: '-1px',
}

const sub = {
    color: '#888888',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '3px',
    marginTop: '8px',
}

const quoteSection = {
    backgroundColor: '#111111',
    border: '1px solid #222222',
    padding: '40px',
    borderRadius: '24px',
    textAlign: 'center' as const,
    marginBottom: '48px',
}

const quoteText = {
    color: '#ffffff',
    fontSize: '24px',
    fontStyle: 'italic',
    lineHeight: '1.4',
    marginBottom: '16px',
}

const quoteAuthor = {
    color: '#ff3e3e',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
}

const buttonSection = {
    textAlign: 'center' as const,
}

const button = {
    backgroundColor: '#ff3e3e',
    borderRadius: '16px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'black',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
}

const footer = {
    color: '#444',
    fontSize: '11px',
    textAlign: 'center' as const,
    marginTop: '60px',
}
