# Rakshith Portfolio Project - Data Visualization CSE 578 

# VAST Challenge 2022

## Group Members

- Ankit Basrur
- Awani Kendurkar
- Prasann Prashant Shimpi
- Rakshith Chandrashekar
- Siddartha Gurugubelli
- Sidharth Dinesh

## Challenge Description

**Challenge 1: Demographics and Relationships** involves understanding the city’s demographics. Given social networks and other information about the city, you will analyze the available data to prepare a one-page fact sheet about the city’s demographics, its neighborhoods, and its business base.

In Challenge 1, you will use visual analytic techniques to address the following questions:

- Assuming the volunteers are representative of the city’s population, characterize what you can about the demographics of the town. Provide your rationale and supporting data. Limit your response to 10 images and 500 words.
- Consider the social activities in the community. What patterns do you see in the social networks in the town? Describe up to ten significant patterns you observe, with evidence and rationale. Limit your response to 10 images and 500 words.
- Identify the predominant business base of the town, and describe patterns you observe. Limit your response to 10 images and 500 words.
- From your answers to questions 1-3, assemble a one-page summary that provides the key information to share with residents about the town.

## Steps To Run

1. Download the dataset from [here](https://drive.google.com/file/d/1a1gMCQpw3kjmYbvygWd-yT-5dmPQ8EVN/view) and move the required CSV files to `backend/data`.
2. Create a database on your MySQL server named `data_viz`.
3. Update the username and password in files `backend/preprocess/TablesLoad.py` and `app.py`.
4. Install all the required Python modules.
5. Run the Flask app from the root directory using the following command.

```bash
$ flask run
```

You will see the application running on `http://127.0.0.1:5000` (or your custom port).