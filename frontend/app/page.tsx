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
  Table,
  Tooltip,
  Switch,
} from '@mantine/core';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { colors } from './styles/colors';

type IncomeType = 'employment_income' | 'self_employment_income' | 'pension_income' | 'dividend_income';

export default function Home() {
  const [income, setIncome] = useState(30000);
  const [wageGrowth2026, setWageGrowth2026] = useState(2);
  const [wageGrowth2027, setWageGrowth2027] = useState(2);
  const [wageGrowth2028, setWageGrowth2028] = useState(2);
  const [wageGrowth2029, setWageGrowth2029] = useState(2);
  const [incomeType, setIncomeType] = useState<IncomeType>('employment_income');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useOBRGrowth, setUseOBRGrowth] = useState(true);
  
  const calculateImpact = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create income types distribution (all income in selected type)
      const incomeTypes: Record<string, number> = {};
      incomeTypes[incomeType] = 1.0;
      
      const response = await axios.post('/api/calculate', { 
        income,
        wage_growth: useOBRGrowth ? {} : {
          "2026": wageGrowth2026 / 100,
          "2027": wageGrowth2027 / 100,
          "2028": wageGrowth2028 / 100,
          "2029": wageGrowth2029 / 100
        },
        income_types: incomeTypes
      });
      
      setResults(response.data);

      // If using OBR projections, update the displayed growth values
      if (useOBRGrowth && response.data.assumptions.obr_earnings_growth) {
        setWageGrowth2026(Number(response.data.assumptions.obr_earnings_growth["2026"]) * 100);
        setWageGrowth2027(Number(response.data.assumptions.obr_earnings_growth["2027"]) * 100);
        setWageGrowth2028(Number(response.data.assumptions.obr_earnings_growth["2028"]) * 100);
        setWageGrowth2029(Number(response.data.assumptions.obr_earnings_growth["2029"]) * 100);
      }
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
              UK Income Tax Threshold Freeze Extension Analysis
            </Text>
          </Flex>
        </Container>
      </AppShell.Header>

      <AppShell.Main pt={80}>
        <Container size="lg">
          <Title order={1} mb="md" style={{ color: colors.BLUE }}>Income Tax Threshold Freeze Extension Impact</Title>
          <Text mb="md">
            This tool calculates how extending the freeze on income tax thresholds to 2028/29 and 2029/30 would affect your take-home pay.
          </Text>
          <Text mb="xl" fw={500} c={colors.DARK_GRAY}>
            The UK government has already frozen income tax thresholds until 2027/28. This analysis examines the impact of 
            potentially extending this freeze for an additional two years.
          </Text>
          
          <Paper withBorder p="xl" shadow="xs" radius="md" mt="xl" bg={colors.BLUE_98}>
            <Tabs defaultValue="income">
              <Tabs.List>
                <Tabs.Tab value="income">Income Details</Tabs.Tab>
                <Tabs.Tab value="growth">Wage Growth</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="income" pt="md">
                <Title order={3} mb="md" style={{ color: colors.BLUE }}>Your Annual Income (2025)</Title>
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
                  The impact of extending the income tax threshold freeze depends on how your income grows.
                  Set your expected annual wage growth for 2026-2029 below.
                </Text>

                <Flex align="center" mb="md">
                  <Switch 
                    checked={useOBRGrowth}
                    onChange={(event) => setUseOBRGrowth(event.currentTarget.checked)}
                    label="Use OBR earnings growth forecasts"
                    mr="md"
                  />
                  <Tooltip label="The Office for Budget Responsibility (OBR) publishes official forecasts for earnings growth">
                    <Text size="xs" c="dimmed" style={{ cursor: 'help' }}>
                      What's this?
                    </Text>
                  </Tooltip>
                </Flex>
                
                <Grid mb="md">
                  <Grid.Col span={6}>
                    <NumberInput
                      value={wageGrowth2026}
                      onChange={(val) => setWageGrowth2026(Number(val))}
                      label="2026 Wage Growth (%)"
                      min={0}
                      max={20}
                      step={0.5}
                      rightSection="%"
                      disabled={useOBRGrowth}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      value={wageGrowth2027}
                      onChange={(val) => setWageGrowth2027(Number(val))}
                      label="2027 Wage Growth (%)"
                      min={0}
                      max={20}
                      step={0.5}
                      rightSection="%"
                      disabled={useOBRGrowth}
                    />
                  </Grid.Col>
                </Grid>
                
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
                      disabled={useOBRGrowth}
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
                      disabled={useOBRGrowth}
                    />
                  </Grid.Col>
                </Grid>
                
                {!useOBRGrowth && (
                  <Box mt="md">
                    <Text fw={500} mb="xs">2026-2029 Wage Growth</Text>
                    <Slider
                      value={wageGrowth2028} // We're using 2028 as the default for all years in the slider
                      onChange={(value) => {
                        setWageGrowth2026(value);
                        setWageGrowth2027(value);
                        setWageGrowth2028(value);
                        setWageGrowth2029(value);
                      }}
                      min={0}
                      max={10}
                      step={0.5}
                      label={formatPercentage}
                      mb="xl"
                    />
                    <Text size="xs" c="dimmed" ta="center">Set the same growth rate for all years</Text>
                  </Box>
                )}
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
                  By extending the income tax threshold freeze to 2028/29 and 2029/30, you would lose approximately{' '}
                  <strong>{formatGBP(results.total_impact)}</strong> in take-home pay compared to if thresholds were
                  adjusted for inflation after 2027/28.
                </Text>
                
                <Accordion mt="xl">
                  <Accordion.Item value="assumptions">
                    <Accordion.Control>
                      <Group>
                        <Text>Your Assumptions</Text>
                        <Badge color="brand">2025-2029</Badge>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack>
                        <Box>
                          <Text fw={500}>Base Income (2025):</Text>
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
                  
                  <Accordion.Item value="tax_parameters">
                    <Accordion.Control>
                      <Group>
                        <Text>Income Tax Parameters</Text>
                        <Badge color="accent">Compare scenarios</Badge>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Title order={4} mb="md">Personal Allowance</Title>
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Year</Table.Th>
                            <Table.Th>No Extension (£)</Table.Th>
                            <Table.Th>With Extension (£)</Table.Th>
                            <Table.Th>Difference (£)</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {Object.entries(results.tax_parameters.baseline.personal_allowance).map(([year, value]) => (
                            <Table.Tr key={year}>
                              <Table.Td>{year}</Table.Td>
                              <Table.Td>{value.toLocaleString()}</Table.Td>
                              <Table.Td>{results.tax_parameters.reform.personal_allowance[year].toLocaleString()}</Table.Td>
                              <Table.Td>{(Number(value) - Number(results.tax_parameters.reform.personal_allowance[year])).toLocaleString()}</Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>

                      <Title order={4} mt="xl" mb="md">Higher Rate Threshold</Title>
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Year</Table.Th>
                            <Table.Th>No Extension (£)</Table.Th>
                            <Table.Th>With Extension (£)</Table.Th>
                            <Table.Th>Difference (£)</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {Object.entries(results.tax_parameters.baseline.higher_rate_threshold).map(([year, value]) => (
                            <Table.Tr key={year}>
                              <Table.Td>{year}</Table.Td>
                              <Table.Td>{value.toLocaleString()}</Table.Td>
                              <Table.Td>{results.tax_parameters.reform.higher_rate_threshold[year].toLocaleString()}</Table.Td>
                              <Table.Td>{(Number(value) - Number(results.tax_parameters.reform.higher_rate_threshold[year])).toLocaleString()}</Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                      
                      <Text size="xs" c="dimmed" mt="md">
                        Note: Current tax rates are {results.tax_parameters.current.basic_rate * 100}% (basic), {results.tax_parameters.current.higher_rate * 100}% (higher), 
                        and {results.tax_parameters.current.additional_rate * 100}% (additional). These remain unchanged in both scenarios.
                      </Text>
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
                    <RechartsTooltip 
                      formatter={(value: number) => formatGBP(value)}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="with_freeze" 
                      name="Net Income (Extended Freeze)" 
                      stroke={colors.BLUE} 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="without_freeze" 
                      name="Net Income (No Extension)" 
                      stroke={colors.TEAL_ACCENT} 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <Box my="md" p="md" style={{ backgroundColor: colors.BLUE_98 }} radius="md">
                  <Text size="sm">
                    <strong>Note:</strong> Income tax thresholds are already frozen until 2027/28. The difference between the scenarios
                    only appears from 2028 onwards, when the extension would take effect.
                  </Text>
                </Box>
              </Paper>
              
              <Paper withBorder p="xl" shadow="xs" radius="md">
                <Title order={3} mb="md" style={{ color: colors.BLUE }}>Annual Loss Due to Freeze Extension</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={results.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis 
                      tickFormatter={(value) => formatGBP(value)}
                    />
                    <RechartsTooltip 
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
                      activeDot={{ r: 8 }}
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