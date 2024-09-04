from flask import Flask,render_template, request, jsonify
import pandas as pd
from sqlalchemy import create_engine
import json

app = Flask(__name__,template_folder="templates")

user = 'root'
pw = 'mysql123'
host = 'localhost'
db = 'data_viz'

@app.route('/')
def restaurants():
    return render_template('restaurants.html')

@app.route('/jovialityTrends')
def lineChart():
    return render_template('jovialityTrends.html')

@app.route('/socialInteractions')
def socialInteractions():
    return render_template('socialInteractions.html')

@app.route('/empTrends')
def empTrends():
    return render_template('radialBubbleChart.html')

def getRecordsFromTable(table):
    engine = create_engine(f'mysql+pymysql://{user}:{pw}@{host}/{db}')
    with engine.connect() as conn, conn.begin():
        data = pd.read_sql_table(table, conn)
    conn.close()
    return data.to_json(orient="records")

@app.route('/processDataParticipants', methods=['POST'])
def processDataParticipants():
    return getRecordsFromTable('Participants')

@app.route('/processDataEmployeePopulation', methods=['POST'])
def processDataEmployeePopulation():
    return getRecordsFromTable('EmployeePopulation')

@app.route('/processDataHeatmap', methods=['POST'])
def processDataHeatmap():
    engine = create_engine(f'mysql+pymysql://{user}:{pw}@{host}/{db}')

    with engine.connect() as conn, conn.begin():
        pubsDf = pd.read_sql("Pubs", conn) \
            .rename(columns={"hourlyCost": "avgCost", "pubId": "locId", "locationX": "endLocationX", "locationY": "endLocationY"}) \
            .assign(locType = 'Pub')
        restaurantsDf = pd.read_sql("Restaurants", conn) \
            .rename(columns={"foodCost": "avgCost", "restaurantId": "locId", "locationX": "endLocationX", "locationY": "endLocationY"}) \
            .assign(locType = 'Restaurant')
        locLookupDf = pd.read_sql("LocationLookup", conn)
        travelJournalDf = pd.read_sql("SELECT travelStartLocationId, travelEndLocationId FROM TravelJournal", conn)
    conn.close()
    concatDf = pd.concat([pubsDf, restaurantsDf])
    concatDf['quantileCost'] = pd.qcut(concatDf['avgCost'], q=3, labels=range(1,4))
    joinDf1 = pd.merge(concatDf, travelJournalDf, left_on='locId', right_on='travelEndLocationId') \
        .drop(columns=['locId'])
    joinDf2 = pd.merge(joinDf1, locLookupDf, left_on='travelStartLocationId', right_on='locationId') \
        .drop(columns=['locationId'])
    joinDf2['startLocations'] = joinDf2[['travelStartLocationId', 'locationX', 'locationY']].apply(lambda row : tuple(row), axis=1)
    finalDf = joinDf2 \
        .groupby(['travelEndLocationId', 'quantileCost', 'locType', 'endLocationX', 'endLocationY', 'maxOccupancy', 'avgCost'], observed=True) \
        .agg(startLocations=('startLocations', collect_as_list), count=('travelEndLocationId', 'count')) \
        .reset_index()
    finalDf['quantileCount'] = pd.qcut(finalDf['count'], q=5, labels=range(1,6))

    finalDf.sort_values(by='count', ascending=False, inplace=True)

    return finalDf.to_json(orient="records")

def collect_as_list(x):
    return list(x)

if __name__ == '__main__':
    app.run(debug=True)