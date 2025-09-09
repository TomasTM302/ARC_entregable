"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface Props {
  computedFinancialData: any
  formatCurrency: (v: number) => string
}

export default function ChartsSection({ computedFinancialData, formatCurrency }: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Ingresos vs Gastos */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-4 text-[#0e2c52]">Ingresos vs Gastos</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={computedFinancialData.months.map((month: string, index: number) => ({
                    name: month,
                    ingresos: computedFinancialData.summary.totalIncome[index],
                    gastos: computedFinancialData.summary.totalExpenses[index],
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | string) => [
                      `$${formatCurrency(typeof value === 'number' ? value : Number(value))}`,
                      undefined,
                    ]}
                    labelFormatter={(label: any) => `Mes: ${String(label)}`}
                  />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#4CAF50" />
                  <Bar dataKey="gastos" name="Gastos" fill="#F44336" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Balance del Periodo */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-4 text-[#0e2c52]">Balance del Periodo</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={computedFinancialData.months.map((month: string, index: number) => ({
                    name: month,
                    balance: computedFinancialData.summary.periodBalance[index],
                    acumulado: computedFinancialData.summary.accumulatedBalance[index],
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | string) => [
                      `$${formatCurrency(typeof value === 'number' ? value : Number(value))}`,
                      undefined,
                    ]}
                    labelFormatter={(label: any) => `Mes: ${String(label)}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="balance" name="Balance Mensual" stroke="#2196F3" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="acumulado" name="Saldo Acumulado" stroke="#0e2c52" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribución de Ingresos */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-4 text-[#0e2c52]">Distribución de Ingresos (Último Mes)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Cuotas Mantenimiento", value: computedFinancialData.income[1].amounts[7] },
                      { name: "Cuotas Recuperadas", value: computedFinancialData.income[3].amounts[7] },
                      { name: "Cuotas Adelantadas", value: computedFinancialData.income[4].amounts[7] },
                      { name: "Multas", value: computedFinancialData.income[6].amounts[7] },
                      { name: "Áreas comunes", value: computedFinancialData.income[7].amounts[7] },
                      { name: "Convenios", value: computedFinancialData.income[8].amounts[7] },
                      { name: "Otros", value: computedFinancialData.income[9].amounts[7] },
                    ].filter((item) => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""}: ${(((percent ?? 0) * 100) | 0).toFixed(0)}%`}
                  >
                    {["#4CAF50", "#2196F3", "#FFC107", "#9C27B0", "#795548", "#FF5722", "#607D8B"].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | string) => [`$${formatCurrency(typeof value === 'number' ? value : Number(value))}`, undefined]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribución de Gastos */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-4 text-[#0e2c52]">Distribución de Gastos (Último Mes)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Honorarios", value: computedFinancialData.expenses[0].amounts[7] },
                      { name: "Jardinería", value: computedFinancialData.expenses[1].amounts[7] },
                      { name: "Alberca", value: computedFinancialData.expenses[2].amounts[7] },
                      { name: "Seguridad", value: computedFinancialData.expenses[3].amounts[7] },
                      { name: "Basura", value: computedFinancialData.expenses[4].amounts[7] },
                      { name: "Electricidad", value: computedFinancialData.expenses[5].amounts[7] },
                      { name: "Otros", value: computedFinancialData.expenses.slice(6).reduce((sum: number, item: any) => sum + item.amounts[7], 0) },
                    ].filter((item) => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""}: ${(((percent ?? 0) * 100) | 0).toFixed(0)}%`}
                  >
                    {["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#607D8B"].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | string) => [`$${formatCurrency(typeof value === 'number' ? value : Number(value))}`, undefined]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tendencia de Morosidad */}
          <div className="bg-white rounded-lg shadow-sm border p-4 col-span-1 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-[#0e2c52]">Tendencia de Morosidad y Cuotas Ingresadas</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={computedFinancialData.months.map((month: string, index: number) => ({
                    name: month,
                    morosidad: computedFinancialData.morosityByMonth[index],
                    cuotasIngresadas: computedFinancialData.quotasByMonth[index],
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="morosidad" name="Morosidad" stroke="#F44336" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="cuotasIngresadas" name="Cuotas Ingresadas" stroke="#4CAF50" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
