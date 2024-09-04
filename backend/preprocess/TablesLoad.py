import pandas as pd
import pymysql
from sqlalchemy import create_engine
from sqlalchemy import text
from datetime import datetime
import glob

def dropTables(engine):
    with engine.connect() as conn:
        conn.execute(text("""DROP TABLE IF EXISTS `data_viz`.`ParticipantStatusLogs`"""))
        conn.execute(text("""DROP TABLE IF EXISTS `data_viz`.`Jobs`"""))
        conn.execute(text("""DROP TABLE IF EXISTS `data_viz`.`Employers`"""))
        conn.execute(text("""DROP TABLE IF EXISTS `data_viz`.`TravelJournal`"""))
        conn.execute(text("""DROP TABLE IF EXISTS `data_viz`.`LocationLookup`"""))
        conn.execute(text("""DROP TABLE IF EXISTS `data_viz`.`Restaurants`"""))
        conn.execute(text("""DROP TABLE IF EXISTS `data_viz`.`Pubs`"""))
        conn.execute(text("""DROP TABLE IF EXISTS `data_viz`.`SocialNetwork`"""))
        conn.execute(text("""DROP TABLE IF EXISTS `data_viz`.`Participants`"""))
    conn.close()

def loadParticipants(engine):
    engine.connect().execute(text("""CREATE TABLE IF NOT EXISTS `data_viz`.`Participants` (
    `participantId` SMALLINT UNSIGNED NOT NULL,
    `householdSize` SMALLINT UNSIGNED NOT NULL,
    `haveKids` TINYINT NOT NULL,
    `age` SMALLINT UNSIGNED NOT NULL,
    `educationLevel` VARCHAR(100) NOT NULL,
    `interestGroup` CHAR(1) NOT NULL,
    `joviality` DOUBLE(13,12) NOT NULL,
    PRIMARY KEY (`participantId`));"""))

    engine.connect().close()

    df = pd.read_csv('./backend/data/Participants.csv')
    df['haveKids'] = df['haveKids'].apply(lambda x: 1 if x==True else 0)
    print(df.head())
    print(df.dtypes)
    rows = df.to_sql(name='Participants', con=engine, if_exists='append', index=False, chunksize=10000)
    print(f'{rows} rows inserted')

def loadSocialNetwork(engine):
    engine.connect().execute(text("""CREATE TABLE IF NOT EXISTS `data_viz`.`SocialNetwork` (
    `participantIdFrom` SMALLINT UNSIGNED NOT NULL,
    `participantIdTo` SMALLINT UNSIGNED NOT NULL,
    `interactionDate` DATE NOT NULL,
    FOREIGN KEY (`participantIdFrom`) REFERENCES Participants(`participantId`),
    FOREIGN KEY (`participantIdTo`) REFERENCES Participants(`participantId`));"""))

    engine.connect().close()

    df = pd.read_csv('./backend/data/SocialNetwork.csv')
    df.rename(columns={"timestamp": "interactionDate"}, inplace=True)
    df['interactionDate'] = df['interactionDate'].apply(lambda x: datetime.strptime(x[0:10], '%Y-%m-%d'))
    print(df.head())
    print(df.dtypes)
    rows = df.to_sql(name='SocialNetwork', con=engine, if_exists='append', index=False, chunksize=1000000)
    print(f'{rows} rows inserted')

def loadPubs(engine):
    engine.connect().execute(text("""CREATE TABLE IF NOT EXISTS `data_viz`.`Pubs` (
    `pubId` SMALLINT UNSIGNED NOT NULL,
    `hourlyCost` DOUBLE(20, 10) NOT NULL,
    `maxOccupancy` SMALLINT UNSIGNED NOT NULL,
    `locationX` DOUBLE(20, 10) NOT NULL,
    `locationY` DOUBLE(20, 10) NOT NULL,
    PRIMARY KEY (`pubId`));"""))

    engine.connect().close()

    df = pd.read_csv('./backend/data/Pubs.csv').drop(columns={'buildingId'})
    df['locationX'] = df['location'].apply(lambda x: x.replace(' ', '' , 1)).apply(lambda x: x[x.index('(')+1 : x.index(' ')])
    df['locationY'] = df['location'].apply(lambda x: x.replace(' ', '' , 1)).apply(lambda x: x[x.index(' ')+1 : x.index(')')])
    df.drop(columns={'location'}, inplace=True)
    print(df.head())
    print(df.dtypes)
    rows = df.to_sql(name='Pubs', con=engine, if_exists='append', index=False, chunksize=1000000)
    print(f'{rows} rows inserted')

def loadRestaurants(engine):
    engine.connect().execute(text("""CREATE TABLE IF NOT EXISTS `data_viz`.`Restaurants` (
    `restaurantId` SMALLINT UNSIGNED NOT NULL,
    `foodCost` DOUBLE(20, 10) NOT NULL,
    `maxOccupancy` SMALLINT UNSIGNED NOT NULL,
    `locationX` DOUBLE(20, 10) NOT NULL,
    `locationY` DOUBLE(20, 10) NOT NULL,
    PRIMARY KEY (`restaurantId`));"""))

    engine.connect().close()

    df = pd.read_csv('./backend/data/Restaurants.csv').drop(columns={'buildingId'})
    df['locationX'] = df['location'].apply(lambda x: x.replace(' ', '' , 1)).apply(lambda x: x[x.index('(')+1 : x.index(' ')])
    df['locationY'] = df['location'].apply(lambda x: x.replace(' ', '' , 1)).apply(lambda x: x[x.index(' ')+1 : x.index(')')])
    df.drop(columns={'location'}, inplace=True)
    print(df.head())
    print(df.dtypes)
    rows = df.to_sql(name='Restaurants', con=engine, if_exists='append', index=False, chunksize=1000000)
    print(f'{rows} rows inserted')


def loadLocationLookup(engine):
    engine.connect().execute(text("""CREATE TABLE IF NOT EXISTS `data_viz`.`LocationLookup` (
    `locationId` SMALLINT UNSIGNED NOT NULL,
    `locationX` DOUBLE(20, 10) NOT NULL,
    `locationY` DOUBLE(20, 10) NOT NULL,
    PRIMARY KEY (`locationId`));"""))

    engine.connect().close()

    aptDf = pd.read_csv('./backend/data/Apartments.csv')[['apartmentId','location']].rename(columns={"apartmentId": "locationId"})
    empDf = pd.read_csv('./backend/data/Employers.csv')[['employerId','location']].rename(columns={"employerId": "locationId"})
    pubsDf = pd.read_csv('./backend/data/Pubs.csv')[['pubId','location']].rename(columns={"pubId": "locationId"})
    restaurantDf = pd.read_csv('./backend/data/Restaurants.csv')[['restaurantId','location']].rename(columns={"restaurantId": "locationId"})
    schoolDf = pd.read_csv('./backend/data/Schools.csv')[['schoolId','location']].rename(columns={"schoolId": "locationId"})

    df = pd.concat([aptDf, empDf, pubsDf, restaurantDf, schoolDf], ignore_index=True, sort=False)
    df['locationX'] = df['location'].apply(lambda x: x.replace(' ', '' , 1)).apply(lambda x: x[x.index('(')+1 : x.index(' ')])
    df['locationY'] = df['location'].apply(lambda x: x.replace(' ', '' , 1)).apply(lambda x: x[x.index(' ')+1 : x.index(')')])
    df.drop(columns={'location'}, inplace=True)
    print(df.head())
    print(df.dtypes)
    rows = df.to_sql(name='LocationLookup', con=engine, if_exists='append', index=False, chunksize=1000000)
    print(f'{rows} rows inserted')

def loadTravelJournal(engine):
    engine.connect().execute(text("""CREATE TABLE IF NOT EXISTS `data_viz`.`TravelJournal` (
    `participantId` SMALLINT UNSIGNED NOT NULL,
    `travelStartLocationId` SMALLINT UNSIGNED,
    `travelEndLocationId` SMALLINT UNSIGNED NOT NULL,
    `purpose` VARCHAR(100) NOT NULL,
    `amtSpent` DOUBLE(20, 10) NOT NULL,
    FOREIGN KEY (`participantId`) REFERENCES Participants(`participantId`),
    FOREIGN KEY (`travelStartLocationId`) REFERENCES LocationLookup(`locationId`),
    FOREIGN KEY (`travelEndLocationId`) REFERENCES LocationLookup(`locationId`));"""))

    engine.connect().close()

    df = pd.read_csv('./backend/data/TravelJournal.csv')
    df['amtSpent'] = df.apply(lambda row: row.startingBalance - row.endingBalance, axis=1)
    df.drop(columns={'travelStartTime', 'travelEndTime', 'checkInTime', 'checkOutTime', 'startingBalance', 'endingBalance'}, inplace=True)
    print(df.head())
    print(df.dtypes)
    rows = df.to_sql(name='TravelJournal', con=engine, if_exists='append', index=False, chunksize=1000000)
    print(f'{rows} rows inserted')

def loadEmployers(engine):
    engine.connect().execute(text("""CREATE TABLE IF NOT EXISTS `data_viz`.`Employers` (
    `employerId` SMALLINT UNSIGNED NOT NULL,
    `locationX` DOUBLE(20, 10) NOT NULL,
    `locationY` DOUBLE(20, 10) NOT NULL,
    PRIMARY KEY (`employerId`));"""))

    engine.connect().close()

    df = pd.read_csv('./backend/data/Employers.csv').drop(columns={'buildingId'})
    df['locationX'] = df['location'].apply(lambda x: x.replace(' ', '' , 1)).apply(lambda x: x[x.index('(')+1 : x.index(' ')])
    df['locationY'] = df['location'].apply(lambda x: x.replace(' ', '' , 1)).apply(lambda x: x[x.index(' ')+1 : x.index(')')])
    df.drop(columns={'location'}, inplace=True)
    print(df.head())
    print(df.dtypes)
    rows = df.to_sql(name='Employers', con=engine, if_exists='append', index=False, chunksize=1000000)
    print(f'{rows} rows inserted')

def loadJobs(engine):
    engine.connect().execute(text("""CREATE TABLE IF NOT EXISTS `data_viz`.`Jobs` (
    `jobId` SMALLINT UNSIGNED NOT NULL,
    `employerId` SMALLINT UNSIGNED NOT NULL,
    `hourlyRate` DOUBLE(20, 10) NOT NULL,
    `startTime` TIME NOT NULL,
    `endTime` TIME NOT NULL,
    `daysToWork` VARCHAR(100) NOT NULL,
    `educationRequirement` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`jobId`),
    FOREIGN KEY (`employerId`) REFERENCES Employers(`employerId`));"""))

    engine.connect().close()

    df = pd.read_csv('./backend/data/Jobs.csv')
    df['startTime'] = df['startTime'].apply(lambda x: datetime.strptime(x, '%I:%M:%S %p').strftime('%H:%M:%S'))
    df['endTime'] = df['endTime'].apply(lambda x: datetime.strptime(x, '%I:%M:%S %p').strftime('%H:%M:%S'))
    print(df.head())
    print(df.dtypes)
    rows = df.to_sql(name='Jobs', con=engine, if_exists='append', index=False, chunksize=1000000)
    print(f'{rows} rows inserted')

def loadParticipantStatusLogs(engine):
    engine.connect().execute(text("""CREATE TABLE IF NOT EXISTS `data_viz`.`ParticipantStatusLogs` (
    `participantId` SMALLINT UNSIGNED NOT NULL,
    `statusTimestampDay` DATE NOT NULL,
    `currentMode` VARCHAR(50) NOT NULL,
    `jobId` SMALLINT UNSIGNED NOT NULL,
    `financialStatus` VARCHAR(50) NOT NULL,
    `availableBalance` DOUBLE(20, 10) NOT NULL,
    FOREIGN KEY (`participantId`) REFERENCES Participants(`participantId`),
    FOREIGN KEY (`jobId`) REFERENCES Jobs(`jobId`));"""))

    engine.connect().close()

    path = './backend/data/ParticipantStatusLogs'
    csv_files = glob.glob(path + '/*.csv')
    df_list = []
    for file in csv_files:
        df = pd.read_csv(file)[['participantId', 'timestamp', 'currentMode', 'jobId', 'financialStatus', 'availableBalance']]
        df.rename(columns={'timestamp':'statusTimestamp'}, inplace=True)
        df = df[df.currentMode == "AtWork"]
        df['statusTimestamp'] = df['statusTimestamp'].apply(lambda x: datetime.strptime(x, '%Y-%m-%dT%H:%M:%SZ').strftime('%Y-%m-%d %H:%M:%S'))
        df['statusTimestampDay'] = df['statusTimestamp'].apply(lambda x: datetime.strptime(x, '%Y-%m-%d %H:%M:%S').strftime('%Y-%m-%d'))
        df = df.drop_duplicates(subset=['participantId', 'statusTimestampDay', 'jobId'], keep = 'last')
        df.drop(columns={'statusTimestamp'}, inplace=True)
        df_list.append(df)
        print(f'Processed {file}')
    big_df = pd.concat(df_list)
    big_df = big_df.drop_duplicates(subset=['participantId', 'statusTimestampDay', 'jobId'], keep = 'last')
    print(big_df.head())
    print(big_df.dtypes)
    rows = big_df.to_sql(name='ParticipantStatusLogs', con=engine, if_exists='append', index=False, chunksize=1000000)
    print(f'{rows} rows inserted')

if __name__ == "__main__":
    user = 'root'
    pw = 'mysql123'
    host = 'localhost'
    db = 'data_viz'

    engine = create_engine(f'mysql+pymysql://{user}:{pw}@{host}/{db}')

    # dropTables(engine)
    loadParticipants(engine)
    loadSocialNetwork(engine)
    loadPubs(engine)
    loadRestaurants(engine)
    loadLocationLookup(engine)
    loadTravelJournal(engine)
    loadEmployers(engine)
    loadJobs(engine)
    loadParticipantStatusLogs(engine)