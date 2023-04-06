---
layout: post
title:  "Implementing a tool for creating point-and-figure (P&F) charts using Python"
date:   2023-04-06
categories: finance fintech python yfinance
---

## Introduction

In this post we will be implementing a tool for creating [point-and-figure (P&F) charts](https://www.investopedia.com/terms/p/pointandfigurechart.asp) using Python [`yfinance`](https://pypi.org/project/yfinance/) and [`pandas`](https://pandas.pydata.org/). For a while the outlook for the global economy has been gloomy and a lot of stocks have come down on their prices giving a potential opportunity to buy them. Implementing a tool that displays P&F charts will help us find the best [timing](https://www.investopedia.com/thmb/yhY3ByCRFuTZdWwou4_j52euDIE=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/PointandFigureCharting_ABasicIntroduction1_3-f2c1607b71134fcc922dff14537b373a.png) for buying (and selling) stocks. 

## Point-and-figure (P&F) charts

P&F charts are a way to visualize changes in price for various financial instruments without taking into consideration the passage of time. It is mostly used to keep track of medium-term trends.

For P&F charts are usually formed using the daily close prices of the instrument. Each column of the P&F chart consists of stacked `X`'s or `O`'s which represent rising and falling prices respectively. The space occupied by a single mark is called a box. To form a P&F chart the trader needs to set the following parameters:
- *Box size* is a price range set by the trader. For example if the box size is set to `0.5` and the stock price is at `14.43`, then the corresponding box would be at `14.0`.
- *Reversal amount* is another parameter set by the trader. It is the amount of change in boxes in the opposite direction needed for the trend to change direction. Usualy it is set to `3`. This means that if the box size is `0.5`, the trend is rising and the latest marked price is at level `14.0`, then the level of the new price would have to be lower or equal to `12.5` to change the trend from rising to falling.

Progression of the price is marked in the chart based on following rules:

- If the trend is rising and the level of the price is higher than the highest level of the current stack, `X`'s are stacked on top of it until they reach the box that is on the level of the new highest price. Same applies for `O`'s in the opposite direction when the trend is falling.
- If the difference in boxes between level of the price and level of the last marked price is over the reversal amount in the direction opposite to the trend, the direction of the trend will be changed. The new trend will have its marks in a new column.
- The beginning of each month is represented in the chart by setting the first mark of the month to number 1-9 for January-September or letter A-C for October-December.

Sampo's P&F chart with box size `0.5` and reversal amount `3` beginning from 1.1.2022 until 6.4.2023 is shown below:
```
49.5                         X                                                                           
49.0                         C1X                                                                         
48.5                         XOX2                                                                        
48.0                         XOXO                                                                        
47.5                         XOXO                                                                        
47.0                         XO O                                                                        
46.5                       X X  O                                                                        
46.0         X           X XBX  O                                                                        
45.5         XO          XOXOX  O                                                                        
45.0         XO        X XOXOX  O                                                                        
44.5         XO        X9XOXOX  3                                                                        
44.0         XOX       XOXOXO   OX                                                                       
43.5         X5XO      XO OA    O4                                                                       
43.0   X   X XOXOX     X  O     OX                                                                       
42.5 1 XO  XOXOXOX6    8        OX                                                                       
42.0  O2O  XO4OXOXOX X X        OX                                                                       
41.5  OXOX XO OXO OX7XOX        O                                                                        
41.0  OXOX3X  O   OXOXOX                                                                                 
40.5  OXOXOX      OXO OX                                                                                 
40.0  OXOXOX      O   O                                                                                  
39.5  OXOXOX                                                                                             
39.0  O O OX                                                                                             
38.5      OX                                                                                             
38.0      OX                                                                                             
37.5      OX                                                                                             
37.0      OX                                                                                             
36.5      OX                                                                                             
36.0      O                                                                                            
```
## Implementing the tool

For the tool we need to install `pandas` and `yfinance` by writing the following line in console:
```
pip install pandas yfinance
```
Now import them to `point_and_figure.py`:
```python
import yfinance as yf
import pandas as pd
import math
```
Before writing the actual code for P&F charts let us write two helper functions. In `point_and_figure.py`:
```python
#...
def round_to_nearest(price, step):
        return round(math.floor(price / step) * step, 2)

def get_month_index(date):
        month = str(date).split("-")[1]
        match month:
                case '01':
                    return 0
                case '02':
                    return 1
                case '03':
                    return 2
                case '04':
                    return 3
                case '05':
                    return 4
                case '06':
                    return 5
                case '07':
                    return 6
                case '08':
                    return 7
                case '09':
                    return 8
                case '10':
                    return 9
                case '11':
                    return 10
                case '12':
                    return 11
```
With the help of step parameter `round_to_nearest` lets us round the price to the nearest price level. `get_month_index` determine the month from `date` which is in `yyyy-mm-dd` form and return an index which we can later use to mark the month to the chart. Now that we have our helper functions we can begin writing the code for P&F charts. In `point_and_figure.py`:
```python
#...
def chart(step, ticker, startDate, endDate=None):
        instrument = yf.Ticker(ticker)
        hist = instrument.history(start=startDate, end=endDate)
        df = pd.DataFrame({'Date':hist['Close'].index, 'Close': hist['Close'].values})

        close_prices = df['Close']
        dates = df['Date']
        # to be continued...
```
The box size (`step`), ticker of the instrument, start date and end date is passed to function `chart`. We access the financial data of the instrument with the `Ticker` module and create a dataframe out of its historical data. From the dataframe we extract closing prices of the instrument as well as the corresponding dates.

Next we will initialize the chart grid. We use the closing price of the starting day as well as the highest and lowest closing prices to determine the starting position on the chart as well as the height of the chart. We set the width of the chart to `100` columns. We will save the starting row as well as the starting price for later use. In `point_and_figure.py`:
```python
#...
def chart(step, ticker, startDate, endDate=None):
    #...
    current = round_to_nearest(close_prices[0], step)
    min_price = round_to_nearest(min(close_prices), step)
    max_price = round_to_nearest(max(close_prices), step)

    height = round((max_price-min_price)/step)+1
    width = 100
    grid = [[' ' for _ in range(width)] for _ in range(height)]

    row = round((max_price-current)/step)
    col = 0
    
    startRow = row
    b = current
    # to be continued...
```
For the chart reversal amount needs to be set. We will name it `th` and give it value `3`. Regardless of the box size `3` is the default reversal amount in many cases. We will also create array `months` where we store the numbers/characters that correspond to months. We determine the month or the starting date and base on that set the starting mark to corresponding number/character on the grid.

We initialize `trend` to `0`. `trend` is set to `1` when it is rising and to `0` when it is falling. `dateIndex` is set to `1` which correspond to the next date after starting date. `newMonth` tells us wether the month has changed. The month is determined for the starting date so we set it to `False`. In `point_and_figure.py`:
```python
#...
def chart(step, ticker, startDate, endDate=None):
    #...
    th = 3

    months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C']
    monthIndex = get_month_index(dates[0])
    grid[row][col] = months[monthIndex]

    
    trend = 0 
    dateIndex = 1
    newMonth = False
    # to be continued...
```
Next we will update the grid based on all the closing prices. In `point_and_figure.py`:
```python
#...
def chart(step, ticker, startDate, endDate=None):
    #...
    for close_price in close_prices[1:]:
        oldMonthIndex = monthIndex
        monthIndex = get_month_index(dates[dateIndex])
        if oldMonthIndex != monthIndex:
                newMonth = True
        price_rounded = round_to_nearest(close_price, step)
        if trend == 1:
            if price_rounded > current:
                for i in range(0, round((price_rounded-current)/step)):
                    if newMonth:
                        grid[row-i-1][col] = months[monthIndex]
                        newMonth = False
                    else:
                        grid[row-i-1][col] = 'X'
                row -= round((price_rounded-current)/step)
                current = price_rounded
            elif price_rounded <= current - th*step:
                col += 1
                for i in range(0, round((current-price_rounded)/step)):
                    if newMonth:
                        grid[row+i+1][col] = months[monthIndex]
                        newMonth = False
                    else:
                        grid[row+i+1][col] = 'O'
                row -= round((price_rounded-current)/step)
                current = price_rounded
                trend = -1
        elif trend == -1:
            if price_rounded < current:
                for i in range(0, round((current-price_rounded)/step)):
                    if newMonth:
                        grid[row+i+1][col] = months[monthIndex]
                        newMonth = False
                    else:
                        grid[row+i+1][col] = 'O'
                row -= round((price_rounded-current)/step)
                current = price_rounded
            elif price_rounded >= current + th*step:
                col += 1
                for i in range(0, round((price_rounded-current)/step)):
                    if newMonth:
                        grid[row-i-1][col] = months[monthIndex]
                        newMonth = False
                    else:
                        grid[row-i-1][col] = 'X'
                row -= round((price_rounded-current)/step)
                current = price_rounded
                trend = 1
        else:
            if price_rounded >= current + th*step:
                for i in range(0, round((price_rounded-current)/step)):
                    if newMonth:
                        grid[row-i-1][col] = months[monthIndex]
                        newMonth = False
                    else:
                        grid[row-i-1][col] = 'X'
                row -= round((price_rounded-current)/step)
                current = price_rounded
                trend = 1
            elif price_rounded <= current - th*step:
                col += 1
                for i in range(0, round((current-price_rounded)/step)):
                    if newMonth:
                        grid[row+i+1][col] = months[monthIndex]
                        newMonth = False
                    else:
                        grid[row+i+1][col] = 'O'
                row -= round((price_rounded-current)/step)
                current = price_rounded
                trend = -1
        dateIndex += 1
    # to be continued...
```
Based on the value of `trend` the code updates the state of the chart based on the rules given. `newMonth` is set to `True` when the month changes and set back to `False` when the new month has been marked. Let us finish the code by returning the chart. In `point_and_figure.py`:
```python
#...
def chart(step, ticker, startDate, endDate=None):
    #...
    chart = ""
    for i in range(height):
        chart += "{:>4.1f} ".format((startRow-i)*step+b)
        for j in range(width):
            chart += grid[i][j]
        chart += "\n"
    return chart
```
And there we have it! P&F chart of Sampo starting with box size 0.5 starting from 1.1.2022 can be obtained and printed with following lines in `point_and_figure.py`:

```python
#...
s = chart(0.5, "SAMPO.HE", "2022-01-01")
print(s)
```
