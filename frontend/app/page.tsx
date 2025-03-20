'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ActionIcon,
  Modal,
  Select,
  Loader,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import axios from 'axios';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceArea
} from 'recharts';
import { colors } from './styles/colors';

type IncomeType = 'employment_income' | 'self_employment_income' | 'pension_income' | 'dividend_income';

type IncomeItem = {
  id: string;
  amount: number;
  type: IncomeType;
};

const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  'employment_income': 'Employment',
  'self_employment_income': 'Self-Employment',
  'pension_income': 'Pension',
  'dividend_income': 'Dividends'
};

export default function Home() {
  const [incomes, setIncomes] = useState<IncomeItem[]>([
    { id: '1', amount: 30000, type: 'employment_income' }
  ]);
  const [wageGrowth2026, setWageGrowth2026] = useState(2);
  const [wageGrowth2027, setWageGrowth2027] = useState(2);
  const [wageGrowth2028, setWageGrowth2028] = useState(2);
  const [wageGrowth2029, setWageGrowth2029] = useState(2);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useOBRGrowth, setUseOBRGrowth] = useState(true);
  const [addIncomeModalOpen, setAddIncomeModalOpen] = useState(false);
  const [newIncomeAmount, setNewIncomeAmount] = useState(0);
  const [newIncomeType, setNewIncomeType] = useState<IncomeType>('employment_income');
  const [percentileData, setPercentileData] = useState<any>(null);
  const [loadingPercentileData, setLoadingPercentileData] = useState(false);
  const [userPercentilePosition, setUserPercentilePosition] = useState<number | null>(null);
  const [userImpactAmount, setUserImpactAmount] = useState<number | null>(null);
  
  // Ref for scrolling to the impact chart section
  const chartRef = React.useRef<HTMLDivElement>(null);
  
  const calculateImpact = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/calculate', { 
        incomes: incomes.map(income => ({
          amount: income.amount,
          type: income.type
        })),
        wage_growth: useOBRGrowth ? {} : {
          "2026": wageGrowth2026 / 100,
          "2027": wageGrowth2027 / 100,
          "2028": wageGrowth2028 / 100,
          "2029": wageGrowth2029 / 100
        }
      });
      
      setResults(response.data);

      // If using OBR projections, update the displayed growth values
      if (useOBRGrowth && response.data.assumptions.obr_earnings_growth) {
        const obrData = response.data.assumptions.obr_earnings_growth;
        setWageGrowth2026(parseFloat((obrData["2026"] * 100).toFixed(2)));
        setWageGrowth2027(parseFloat((obrData["2027"] * 100).toFixed(2)));
        setWageGrowth2028(parseFloat((obrData["2028"] * 100).toFixed(2)));
        setWageGrowth2029(parseFloat((obrData["2029"] * 100).toFixed(2)));
      }
      
      // Calculate the user's position on the income scale (approx. percentile)
      // This is a simple approximation based on their net income
      const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
      // Using a simplified formula to estimate percentile (actual distribution would be more complex)
      // Roughly calibrated based on UK income distribution
      let estimatedPercentile;
      if (totalIncome < 15000) {
        estimatedPercentile = (totalIncome / 15000) * 25; // Bottom 25%
      } else if (totalIncome < 30000) {
        estimatedPercentile = 25 + ((totalIncome - 15000) / 15000) * 25; // 25-50%
      } else if (totalIncome < 60000) {
        estimatedPercentile = 50 + ((totalIncome - 30000) / 30000) * 30; // 50-80%
      } else {
        estimatedPercentile = 80 + Math.min(((totalIncome - 60000) / 140000) * 20, 19.9); // 80-100%
      }
      
      setUserPercentilePosition(Math.min(Math.max(estimatedPercentile, 1), 99));
      setUserImpactAmount(response.data.total_impact);
      
      // After calculation is complete, scroll to the chart
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    } catch (err) {
      console.error('Error calculating impact:', err);
      setError('Failed to calculate impact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addIncome = () => {
    if (newIncomeAmount > 0) {
      setIncomes([
        ...incomes,
        {
          id: Date.now().toString(),
          amount: newIncomeAmount,
          type: newIncomeType
        }
      ]);
      setNewIncomeAmount(0);
      setAddIncomeModalOpen(false);
    }
  };

  const removeIncome = (id: string) => {
    if (incomes.length > 1) {
      setIncomes(incomes.filter(income => income.id !== id));
    }
  };

  const updateIncomeAmount = (id: string, amount: number) => {
    setIncomes(incomes.map(income => 
      income.id === id ? { ...income, amount } : income
    ));
  };

  const updateIncomeType = (id: string, type: IncomeType) => {
    setIncomes(incomes.map(income => 
      income.id === id ? { ...income, type } : income
    ));
  };

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

  const formatGBP = (value: number) => `£${value.toLocaleString('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
  
  const formatPercentage = (value: number) => `${value}%`;
  
  const fetchPercentileData = async () => {
    try {
      setLoadingPercentileData(true);
      const response = await axios.get('/api/percentile-impact');
      setPercentileData(response.data);
    } catch (err) {
      console.error('Error fetching percentile data:', err);
    } finally {
      setLoadingPercentileData(false);
    }
  };
  
  // Fetch percentile data on component mount
  useEffect(() => {
    fetchPercentileData();
  }, []);
  
  // No marker positioning needed anymore

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
              UK income tax freeze extension analysis
            </Text>
          </Flex>
        </Container>
      </AppShell.Header>

      <AppShell.Main pt={80}>
        <Container size="lg">
          <Title order={1} mb="md" style={{ color: colors.BLUE }}>Income tax threshold freeze extension impact</Title>
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
                <Tabs.Tab value="income">Income details</Tabs.Tab>
                <Tabs.Tab value="growth">Wage growth</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="income" pt="md">
                <Title order={3} mb="md" style={{ color: colors.BLUE }}>Your annual incomes (2025)</Title>
                <Text size="sm" c="dimmed" mb="md">
                  Add all your income sources to get a more accurate calculation.
                </Text>

                {incomes.map((income, index) => (
                  <Box key={income.id} mb="md" p="md" style={{ border: `1px solid ${colors.BLUE_85}`, borderRadius: '8px' }}>
                    <Flex justify="space-between" align="center" mb="xs">
                      <Text fw={500}>Income {index + 1}: {INCOME_TYPE_LABELS[income.type]}</Text>
                      {incomes.length > 1 && (
                        <ActionIcon 
                          color="red" 
                          variant="subtle"
                          onClick={() => removeIncome(income.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      )}
                    </Flex>
                    
                    <Grid>
                      <Grid.Col span={8}>
                        <NumberInput
                          value={income.amount}
                          onChange={(val) => updateIncomeAmount(income.id, Number(val))}
                          label="Annual amount (£)"
                          min={0}
                          max={1000000}
                          step={1000}
                          leftSection="£"
                          mb="xs"
                        />
                        <Slider
                          value={income.amount}
                          onChange={(value) => updateIncomeAmount(income.id, value)}
                          min={0}
                          max={200000}
                          step={1000}
                          label={(value) => `£${value.toLocaleString()}`}
                          mb="md"
                        />
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <Select
                          label="Income type"
                          value={income.type}
                          onChange={(val) => updateIncomeType(income.id, val as IncomeType)}
                          data={[
                            { label: 'Employment', value: 'employment_income' },
                            { label: 'Self-Employment', value: 'self_employment_income' },
                            { label: 'Pension', value: 'pension_income' },
                            { label: 'Dividends', value: 'dividend_income' },
                          ]}
                        />
                      </Grid.Col>
                    </Grid>
                  </Box>
                ))}

                <Group justify="center" mt="lg">
                  <Button 
                    variant="outline" 
                    leftSection={<IconPlus size={16} />}
                    onClick={() => setAddIncomeModalOpen(true)}
                  >
                    Add another income source
                  </Button>
                </Group>

                <Box mt="xl" p="md" style={{ border: `1px solid ${colors.BLUE_85}`, borderRadius: '8px' }}>
                  <Text fw={500} mb="md">Income summary</Text>
                  <Text mb="xs">Total annual income: {formatGBP(totalIncome)}</Text>
                  
                  {incomes.length > 1 && (
                    <Box mt="md">
                      <Text size="sm" mb="xs">Income distribution:</Text>
                      <Grid>
                        {incomes.map((income) => {
                          const percentage = Math.round((income.amount / totalIncome) * 100);
                          return (
                            <Grid.Col key={income.id} span={12}>
                              <Flex align="center" gap="xs">
                                <Box 
                                  w={`${percentage}%`} 
                                  style={{ 
                                    backgroundColor: 
                                      income.type === 'employment_income' ? colors.BLUE : 
                                      income.type === 'self_employment_income' ? colors.TEAL_ACCENT : 
                                      income.type === 'pension_income' ? colors.GREEN :
                                      colors.PURPLE,
                                    height: '20px',
                                    minWidth: '10px',
                                    borderRadius: '4px'
                                  }} 
                                />
                                <Text size="xs">{INCOME_TYPE_LABELS[income.type]}: {percentage}%</Text>
                              </Flex>
                            </Grid.Col>
                          );
                        })}
                      </Grid>
                    </Box>
                  )}
                </Box>
              </Tabs.Panel>

              <Tabs.Panel value="growth" pt="md">
                <Title order={3} mb="md" style={{ color: colors.BLUE }}>Wage growth assumptions</Title>
                <Text size="sm" c="dimmed" mb="md">
                  The impact of extending the income tax threshold freeze depends on how your income grows.
                  {useOBRGrowth ? 
                    'Using the latest OBR earnings growth forecasts.' :
                    'Set your expected annual wage growth for 2026-2029 below.'
                  }
                </Text>

                <Flex align="center" mb="md">
                  <Switch 
                    checked={useOBRGrowth}
                    onChange={(event) => {
                      setUseOBRGrowth(event.currentTarget.checked);
                      // If switching back to OBR and we have results, restore OBR values
                      if (event.currentTarget.checked && results?.assumptions?.obr_earnings_growth) {
                        // Update wage growth values with OBR projections
                        const obrData = results.assumptions.obr_earnings_growth;
                        setWageGrowth2026(parseFloat((obrData["2026"] * 100).toFixed(2)));
                        setWageGrowth2027(parseFloat((obrData["2027"] * 100).toFixed(2)));
                        setWageGrowth2028(parseFloat((obrData["2028"] * 100).toFixed(2)));
                        setWageGrowth2029(parseFloat((obrData["2029"] * 100).toFixed(2)));
                      }
                    }}
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
                      label={useOBRGrowth ? "2026 OBR forecast (%)" : "2026 wage growth (%)"}
                      min={0}
                      max={20}
                      step={0.1}
                      decimalScale={2}
                      rightSection="%"
                      disabled={useOBRGrowth}
                      styles={useOBRGrowth ? { input: { backgroundColor: colors.BLUE_98 } } : {}}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      value={wageGrowth2027}
                      onChange={(val) => setWageGrowth2027(Number(val))}
                      label={useOBRGrowth ? "2027 OBR forecast (%)" : "2027 wage growth (%)"}
                      min={0}
                      max={20}
                      step={0.1}
                      decimalScale={2}
                      rightSection="%"
                      disabled={useOBRGrowth}
                      styles={useOBRGrowth ? { input: { backgroundColor: colors.BLUE_98 } } : {}}
                    />
                  </Grid.Col>
                </Grid>
                
                <Grid mb="md">
                  <Grid.Col span={6}>
                    <NumberInput
                      value={wageGrowth2028}
                      onChange={(val) => setWageGrowth2028(Number(val))}
                      label={useOBRGrowth ? "2028 OBR forecast (%)" : "2028 wage growth (%)"}
                      min={0}
                      max={20}
                      step={0.1}
                      decimalScale={2}
                      rightSection="%"
                      disabled={useOBRGrowth}
                      styles={useOBRGrowth ? { input: { backgroundColor: colors.BLUE_98 } } : {}}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      value={wageGrowth2029}
                      onChange={(val) => setWageGrowth2029(Number(val))}
                      label={useOBRGrowth ? "2029 OBR forecast (%)" : "2029 wage growth (%)"}
                      min={0}
                      max={20}
                      step={0.1}
                      decimalScale={2}
                      rightSection="%"
                      disabled={useOBRGrowth}
                      styles={useOBRGrowth ? { input: { backgroundColor: colors.BLUE_98 } } : {}}
                    />
                  </Grid.Col>
                </Grid>
                
                {!useOBRGrowth && (
                  <Box mt="md">
                    <Text fw={500} mb="xs">2026-2029 wage growth</Text>
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
                Calculate impact
              </Button>
            </Group>
          </Paper>
          
          {error && (
            <Paper withBorder mt="xl" p="md" bg="red.0" radius="md">
              <Text c="red">{error}</Text>
            </Paper>
          )}
          
          <Paper withBorder p="xl" shadow="xs" radius="md" mt="xl" ref={chartRef}>
            <Title order={3} mb="md" style={{ color: colors.BLUE }}>Impact across income distribution</Title>
            {loadingPercentileData ? (
              <Flex justify="center" align="center" h={300}>
                <Loader />
              </Flex>
            ) : percentileData ? (
              <>
                <Text size="sm" c="dimmed" mb="lg">
                  This chart shows how the income tax threshold freeze extension affects households 
                  across different income levels. Each point represents a household, with their 
                  position in the disposable income distribution (before housing costs) and their loss in pounds.
                </Text>
                <div style={{ width: '100%', height: '400px' }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        dataKey="percentile" 
                        name="Income Percentile" 
                        label={{ value: 'Disposable Income Percentile', position: 'insideBottom', offset: -10 }}
                        domain={[0, 100]}
                        padding={{ left: 10, right: 10 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="absolute_difference"
                        name="Income Loss (£)"
                        label={{ 
                          value: 'Income Loss (£)', 
                          angle: -90, 
                          position: 'insideLeft',
                          offset: -15
                        }}
                        padding={{ top: 20 }}
                        tickFormatter={(value) => `£${Math.round(value).toLocaleString()}`}
                        width={90}
                      />
                      {/* All dots same size, no ZAxis needed */}
                      <RechartsTooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value: any, name: string) => {
                          if (name === 'Income Percentile') return `${value.toFixed(1)}`;
                          if (name === 'Income Loss (£)') return formatGBP(value);
                          return value;
                        }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                <p><strong>Disposable income percentile:</strong> {payload[0].payload.percentile.toFixed(1)}</p>
                                <p><strong>Income loss:</strong> {formatGBP(payload[0].payload.absolute_difference)}</p>
                                <p><strong>As percentage:</strong> {`${payload[0].payload.percentage_change.toFixed(2)}%`}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter 
                        name="Households" 
                        data={percentileData.scatter_data} 
                        fill={colors.DARK_GRAY}
                        opacity={0.5}
                        shape="circle"
                        legendType="circle"
                        isAnimationActive={false}
                      />
                      
                      {/* User's position on the chart */}
                      {results && userPercentilePosition !== null && userImpactAmount !== null && (
                        <>
                          {/* Red circle marking the position */}
                          <Scatter 
                            name="Your Household" 
                            data={[{
                              percentile: userPercentilePosition,
                              absolute_difference: userImpactAmount / 2, // Split over 2 years
                              percentage_change: 0 // Not used
                            }]} 
                            fill={colors.BLUE}
                            stroke={colors.BLUE}
                            strokeWidth={2}
                            shape="circle"
                            legendType="circle"
                            size={120}
                          />
                        </>
                      )}
                    </ScatterChart>
                  </ResponsiveContainer>
                  
                  {/* Removed custom SVG overlay */}
                </div>
                <Box my="md" p="md" style={{ backgroundColor: colors.BLUE_98 }} radius="md">
                  <Text size="sm">
                    <strong>Note:</strong> This chart shows data for a representative sample of UK households.
                    Values represent income losses in pounds over the combined period 2028-2029. The horizontal
                    axis shows percentiles of disposable income before housing costs.
                    {results && userPercentilePosition !== null && userImpactAmount !== null && (
                      <span> Your household is shown as a <span style={{ color: colors.BLUE }}>blue circle</span> on the chart, losing approximately {formatGBP(userImpactAmount)}.</span>
                    )}
                  </Text>
                </Box>
              </>
            ) : (
              <Text c="dimmed">Unable to load percentile data.</Text>
            )}
          </Paper>
          
          {results && (
            <Stack mt={30}>
              <Paper withBorder p="xl" shadow="xs" radius="md">
                <Title order={3} mb="md" style={{ color: colors.BLUE }}>Impact summary</Title>
                <Text size="lg" mb="lg">
                  By extending the income tax threshold freeze to 2028/29 and 2029/30, you would lose approximately{' '}
                  <strong>{formatGBP(results.total_impact)}</strong> in take-home pay compared to if thresholds were
                  adjusted for inflation after 2027/28.
                </Text>
                
                <Accordion mt="xl">
                  <Accordion.Item value="assumptions">
                    <Accordion.Control>
                      <Group>
                        <Text>Your assumptions</Text>
                        <Badge color="brand">2025-2029</Badge>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack>
                        <Box>
                          <Text fw={500}>Base income (2025):</Text>
                          <Text>{formatGBP(results.assumptions.base_income)}</Text>
                        </Box>
                        <Divider />
                        <Box>
                          <Text fw={500}>Income sources:</Text>
                          {Object.entries(results.assumptions.income_types).map(
                            ([type, proportion]) => (
                              <Text key={type}>
                                {INCOME_TYPE_LABELS[type as IncomeType] || type.replace('_', ' ')}: {(Number(proportion) * 100).toFixed(1)}%
                              </Text>
                            )
                          )}
                        </Box>
                        <Divider />
                        <Box>
                          <Text fw={500}>Wage growth assumptions:</Text>
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
                        <Text>Income tax parameters</Text>
                        <Badge color="accent">Compare scenarios</Badge>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Title order={4} mb="md">Personal allowance</Title>
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Year</Table.Th>
                            <Table.Th>No extension (£)</Table.Th>
                            <Table.Th>With extension (£)</Table.Th>
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

                      <Title order={4} mt="xl" mb="md">Higher rate threshold</Title>
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Year</Table.Th>
                            <Table.Th>No extension (£)</Table.Th>
                            <Table.Th>With extension (£)</Table.Th>
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
                <Title order={3} mb="md" style={{ color: colors.BLUE }}>Year-by-year net income</Title>
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
                      name="Net income (extended freeze)" 
                      stroke={colors.BLUE} 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="without_freeze" 
                      name="Net income (no extension)" 
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
                <Title order={3} mb="md" style={{ color: colors.BLUE }}>Annual loss due to freeze extension</Title>
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
                      name="Annual loss" 
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

      {/* Add Income Modal */}
      <Modal
        opened={addIncomeModalOpen}
        onClose={() => setAddIncomeModalOpen(false)}
        title="Add income source"
        centered
      >
        <Stack>
          <NumberInput
            label="Annual amount (£)"
            value={newIncomeAmount}
            onChange={(val) => setNewIncomeAmount(Number(val))}
            min={0}
            max={1000000}
            step={1000}
            leftSection="£"
            mb="xs"
          />
          
          <Box mb="md">
            <Slider
              value={newIncomeAmount}
              onChange={setNewIncomeAmount}
              min={0}
              max={200000}
              step={1000}
              label={(value) => `£${value.toLocaleString()}`}
            />
          </Box>
          
          <Select
            label="Income type"
            value={newIncomeType}
            onChange={(val) => setNewIncomeType(val as IncomeType)}
            data={[
              { label: 'Employment', value: 'employment_income' },
              { label: 'Self-Employment', value: 'self_employment_income' },
              { label: 'Pension', value: 'pension_income' },
              { label: 'Dividends', value: 'dividend_income' },
            ]}
          />
          
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setAddIncomeModalOpen(false)}>Cancel</Button>
            <Button onClick={addIncome}>Add</Button>
          </Group>
        </Stack>
      </Modal>
    </AppShell>
  );
}