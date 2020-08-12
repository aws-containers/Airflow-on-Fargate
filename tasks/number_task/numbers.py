from argparse import ArgumentParser

parser = ArgumentParser(description='Airflow Fargate Example')
parser.add_argument('number', help='number', type=int)

if __name__ == '__main__':
    args = parser.parse_args()
    number = args.number
    print("Printing all numbers in given range")
    for i in range(int(number)):
        print(i)
