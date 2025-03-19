'use client';

import { useState } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Slider, 
  Grid, 
  Card, 
  NumberInput, 
  Box, 
  Button, 
  Group, 
  Stack,
  Tabs,
  SegmentedControl,
  Badge,
  Accordion,
  Divider,
  AppShell,
  Image,
  Paper,
  Flex,
} from '@mantine/core';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colors } from './styles/colors';

type IncomeType = 'employment_income' | 'self_employment_income' | 'pension_income' | 'dividend_income';

export default function Home() {
  const [income, setIncome] = useState(30000);
  const [wageGrowth2028, setWageGrowth2028] = useState(2);
  const [wageGrowth2029, setWageGrowth2029] = useState(2);
  const [incomeType, setIncomeType] = useState<IncomeType>('employment_income');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const calculateImpact = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create income types distribution (all income in selected type)
      const incomeTypes: Record<string, number> = {};
      incomeTypes[incomeType] = 1.0;
      
      const response = await axios.post('/api/calculate', { 
        income,
        wage_growth: {
          "2028": wageGrowth2028 / 100,
          "2029": wageGrowth2029 / 100
        },
        income_types: incomeTypes
      });
      
      setResults(response.data);
    } catch (err) {
      console.error('Error calculating impact:', err);
      setError('Failed to calculate impact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatGBP = (value: number) => `£${value.toLocaleString('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
  
  const formatPercentage = (value: number) => `${value}%`;

  return (
    <AppShell 
      header={{ height: 70 }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="lg" style={{ height: '100%' }}>
          <Flex align="center" h="100%" gap="md">
            <Image 
              src="/images/policyengine-logo.png" 
              alt="PolicyEngine Logo" 
              height={40} 
              width={40} 
            />
            <Text fw={700} size="lg">PolicyEngine</Text>
            <Text size="sm" c="dimmed" style={{ marginLeft: 'auto' }}>
              UK Income Tax Freeze Analysis
            </Text>
          </Flex>
        </Container>
      </AppShell.Header>

      <AppShell.Main pt={80}>
        <Container size="lg">
          <Title order={1} mb="md" style={{ color: colors.BLUE }}>UK Income Tax Freeze Impact</Title>
          <Text mb="xl">
            This tool calculates how the freeze on income tax thresholds affects your take-home pay.
            The UK government has frozen income tax thresholds until 2028, which means more people
            are pulled into higher tax bands as their incomes rise with inflation.
          </Text>
          
          <Paper withBorder p="xl" shadow="xs" radius="md" mt="xl" bg={colors.BLUE_98}>
            <Tabs defaultValue="income">
              <Tabs.List>
                <Tabs.Tab value="income">Income Details</Tabs.Tab>
                <Tabs.Tab value="growth">Wage Growth</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="income" pt="md">
                <Title order={3} mb="md" style={{ color: colors.BLUE }}>Your Annual Income</Title>
                <NumberInput
                  value={income}
                  onChange={(val) => setIncome(Number(val))}
                  label="Annual income (£)"
                  min={0}
                  max={1000000}
                  step={1000}
                  mb="md"
                  leftSection="£"
                />
                <Box mt="md">
                  <Slider
                    value={income}
                    onChange={setIncome}
                    min={0}
                    max={200000}
                    step={1000}
                    label={(value) => `£${value.toLocaleString()}`}
                    mb="xl"
                  />
                </Box>
                
                <Title order={4} mt="lg" mb="sm" style={{ color: colors.BLUE }}>Income Type</Title>
                <SegmentedControl
                  data={[
                    { label: 'Employment', value: 'employment_income' },
                    { label: 'Self-Employment', value: 'self_employment_income' },
                    { label: 'Pension', value: 'pension_income' },
                    { label: 'Dividends', value: 'dividend_income' },
                  ]}
                  value={incomeType}
                  onChange={(value) => setIncomeType(value as IncomeType)}
                  fullWidth
                  mb="xl"
                  color="brand"
                />
              </Tabs.Panel>

              <Tabs.Panel value="growth" pt="md">
                <Title order={3} mb="md" style={{ color: colors.BLUE }}>Wage Growth Assumptions</Title>
                <Text size="sm" c="dimmed" mb="md">
                  The freeze on income tax thresholds is particularly impactful when your income rises.
                  Set your expected wage growth for 2028-2029 below.
                </Text>
                
                <Grid mb="md">
                  <Grid.Col span={6}>
                    <NumberInput
                      value={wageGrowth2028}
                      onChange={(val) => setWageGrowth2028(Number(val))}
                      label="2028 Wage Growth (%)"
                      min={0}
                      max={20}
                      step={0.5}
                      rightSection="%"
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      value={wageGrowth2029}
                      onChange={(val) => setWageGrowth2029(Number(val))}
                      label="2029 Wage Growth (%)"
                      min={0}
                      max={20}
                      step={0.5}
                      rightSection="%"
                    />
                  </Grid.Col>
                </Grid>
                
                <Box mt="md">
                  <Text fw={500} mb="xs">2028 Wage Growth</Text>
                  <Slider
                    value={wageGrowth2028}
                    onChange={setWageGrowth2028}
                    min={0}
                    max={10}
                    step={0.5}
                    label={formatPercentage}
                    mb="xl"
                  />
                </Box>
                
                <Box mt="md">
                  <Text fw={500} mb="xs">2029 Wage Growth</Text>
                  <Slider
                    value={wageGrowth2029}
                    onChange={setWageGrowth2029}
                    min={0}
                    max={10}
                    step={0.5}
                    label={formatPercentage}
                    mb="xl"
                  />
                </Box>
              </Tabs.Panel>
            </Tabs>
            
            <Group justify="center" mt="xl">
              <Button 
                size="lg" 
                onClick={calculateImpact}
                loading={loading}
              >
                Calculate Impact
              </Button>
            </Group>
          </Paper>
          
          {error && (
            <Paper withBorder mt="xl" p="md" bg="red.0" radius="md">
              <Text c="red">{error}</Text>
            </Paper>
          )}
          
          {results && (
            <Stack mt={30}>
              <Paper withBorder p="xl" shadow="xs" radius="md">
                <Title order={3} mb="md" style={{ color: colors.BLUE }}>Impact Summary</Title>
                <Text size="lg" mb="lg">
                  With frozen thresholds, from 2023 to 2029 you will lose approximately <strong>{formatGBP(results.total_impact)}</strong> in 
                  take-home pay compared to if thresholds had been increased with inflation.
                </Text>
                
                <Accordion mt="xl">
                  <Accordion.Item value="assumptions">
                    <Accordion.Control>
                      <Group>
                        <Text>Your Assumptions</Text>
                        <Badge color="brand">2023-2029</Badge>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack>
                        <Box>
                          <Text fw={500}>Base Income (2023):</Text>
                          <Text>{formatGBP(results.assumptions.base_income)}</Text>
                        </Box>
                        <Divider />
                        <Box>
                          <Text fw={500}>Income Type:</Text>
                          <Text>
                            {Object.keys(results.assumptions.income_types).map(
                              (type) => type.replace('_', ' ')
                            ).join(', ')}
                          </Text>
                        </Box>
                        <Divider />
                        <Box>
                          <Text fw={500}>Wage Growth Assumptions:</Text>
                          {Object.entries(results.assumptions.wage_growth).map(([year, rate]) => (
                            <Text key={year}>{year}: {(Number(rate) * 100).toFixed(1)}%</Text>
                          ))}
                        </Box>
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              </Paper>
              
              <Paper withBorder p="xl" shadow="xs" radius="md">
                <Title order={3} mb="md" style={{ color: colors.BLUE }}>Year-by-Year Net Income</Title>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={results.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis 
                      tickFormatter={(value) => formatGBP(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatGBP(value)}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="with_freeze" 
                      name="Net Income (Frozen Thresholds)" 
                      stroke={colors.BLUE} 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="without_freeze" 
                      name="Net Income (Inflation-Adjusted Thresholds)" 
                      stroke={colors.TEAL_ACCENT} 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
              
              <Paper withBorder p="xl" shadow="xs" radius="md">
                <Title order={3} mb="md" style={{ color: colors.BLUE }}>Annual Loss Due to Freeze</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={results.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis 
                      tickFormatter={(value) => formatGBP(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatGBP(value)}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="difference" 
                      name="Annual Loss" 
                      stroke={colors.DARK_RED} 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Stack>
          )}
          
          <Box mt={40} mb={20} ta="center">
            <Text size="sm" c="dimmed">
              © {new Date().getFullYear()} PolicyEngine | 
              <a href="https://policyengine.org" target="_blank" rel="noopener noreferrer" style={{ color: colors.BLUE, marginLeft: 5 }}>
                policyengine.org
              </a>
            </Text>
          </Box>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}