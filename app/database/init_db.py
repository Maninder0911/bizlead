from app.database.connection import Base, engine
#from app.models.enquiry import Enquiry

def init_db():
    Base.metadata.create_all(bind=engine)